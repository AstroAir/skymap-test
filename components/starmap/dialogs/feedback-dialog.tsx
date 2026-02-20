'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Bug, ClipboardCopy, Download, Lightbulb, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useFeedbackStore } from '@/lib/stores/feedback-store';
import { buildGitHubIssueUrl, buildIssueBodyMarkdown, collectDiagnostics, exportDiagnosticsBundle } from '@/lib/feedback/feedback-utils';
import { openExternalUrl } from '@/lib/tauri/app-control-api';
import type { FeedbackDiagnostics, FeedbackType } from '@/types/feedback';

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function validateDraft(
  type: FeedbackType,
  title: string,
  description: string,
  reproductionSteps: string,
  expectedBehavior: string
): string | null {
  if (!title.trim()) {
    return 'feedback.errors.titleRequired';
  }
  if (!description.trim()) {
    return 'feedback.errors.descriptionRequired';
  }
  if (type === 'bug' && !reproductionSteps.trim()) {
    return 'feedback.errors.stepsRequired';
  }
  if (type === 'bug' && !expectedBehavior.trim()) {
    return 'feedback.errors.expectedRequired';
  }
  return null;
}

export function FeedbackDialog({ trigger, open, onOpenChange }: FeedbackDialogProps) {
  const t = useTranslations();
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [exporting, setExporting] = useState(false);

  const draft = useFeedbackStore((state) => state.draft);
  const setType = useFeedbackStore((state) => state.setType);
  const updateDraft = useFeedbackStore((state) => state.updateDraft);
  const setIncludeSystemInfo = useFeedbackStore((state) => state.setIncludeSystemInfo);
  const setIncludeLogs = useFeedbackStore((state) => state.setIncludeLogs);

  const isControlled = typeof open === 'boolean';
  const dialogOpen = isControlled ? open : internalOpen;

  const issueTypeHint = useMemo(
    () => (draft.type === 'bug' ? t('feedback.typeBugHint') : t('feedback.typeFeatureHint')),
    [draft.type, t]
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const resolveDiagnostics = async (): Promise<FeedbackDiagnostics | null> => {
    return collectDiagnostics({
      includeSystemInfo: draft.includeSystemInfo,
      includeLogs: draft.includeLogs,
    });
  };

  const handleCopyMarkdown = async () => {
    const validationError = validateDraft(
      draft.type,
      draft.title,
      draft.description,
      draft.reproductionSteps,
      draft.expectedBehavior
    );
    if (validationError) {
      toast.error(t(validationError));
      return;
    }

    setCopying(true);
    try {
      const diagnostics = await resolveDiagnostics();
      const markdown = buildIssueBodyMarkdown({ draft, diagnostics });
      await navigator.clipboard.writeText(markdown);
      toast.success(t('feedback.toast.markdownCopied'));
    } catch {
      toast.error(t('feedback.toast.copyFailed'));
    } finally {
      setCopying(false);
    }
  };

  const handleDownloadDiagnostics = async () => {
    if (!draft.includeSystemInfo && !draft.includeLogs) {
      toast.info(t('feedback.toast.enableDiagnosticsForExport'));
      return;
    }

    setExporting(true);
    try {
      const diagnostics = await resolveDiagnostics();
      if (!diagnostics) {
        toast.info(t('feedback.toast.noDiagnosticsCollected'));
        return;
      }
      const output = await exportDiagnosticsBundle(diagnostics);
      if (output) {
        toast.success(t('feedback.toast.diagnosticsExported'), {
          description: output,
        });
      } else {
        toast.info(t('feedback.toast.downloadCancelled'));
      }
    } catch {
      toast.error(t('feedback.toast.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateDraft(
      draft.type,
      draft.title,
      draft.description,
      draft.reproductionSteps,
      draft.expectedBehavior
    );
    if (validationError) {
      toast.error(t(validationError));
      return;
    }

    setSubmitting(true);
    try {
      const diagnostics = await resolveDiagnostics();
      const result = buildGitHubIssueUrl({ draft, diagnostics });
      await openExternalUrl(result.url);
      if (result.truncated) {
        toast.warning(t('feedback.toast.urlTruncated'));
      }
      toast.success(t('feedback.toast.openedInBrowser'));
      handleOpenChange(false);
    } catch {
      toast.error(t('feedback.toast.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[720px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            {t('feedback.title')}
          </DialogTitle>
          <DialogDescription>{t('feedback.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">{t('feedback.type')}</Label>
              <Select
                value={draft.type}
                onValueChange={(value) => setType(value as FeedbackType)}
              >
                <SelectTrigger id="feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">
                    <span className="inline-flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      {t('feedback.typeBug')}
                    </span>
                  </SelectItem>
                  <SelectItem value="feature">
                    <span className="inline-flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      {t('feedback.typeFeature')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{issueTypeHint}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-title">{t('feedback.titleField')}</Label>
              <Input
                id="feedback-title"
                data-testid="feedback-title-input"
                value={draft.title}
                onChange={(event) => updateDraft({ title: event.target.value })}
                placeholder={t('feedback.titlePlaceholder')}
                maxLength={120}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-description">{t('feedback.descriptionField')}</Label>
            <Textarea
              id="feedback-description"
              data-testid="feedback-description-input"
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
              placeholder={t('feedback.descriptionPlaceholder')}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="feedback-steps">{t('feedback.stepsField')}</Label>
              <Textarea
                id="feedback-steps"
                data-testid="feedback-steps-input"
                value={draft.reproductionSteps}
                onChange={(event) => updateDraft({ reproductionSteps: event.target.value })}
                placeholder={t('feedback.stepsPlaceholder')}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-expected">{t('feedback.expectedField')}</Label>
              <Textarea
                id="feedback-expected"
                data-testid="feedback-expected-input"
                value={draft.expectedBehavior}
                onChange={(event) => updateDraft({ expectedBehavior: event.target.value })}
                placeholder={t('feedback.expectedPlaceholder')}
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-additional">{t('feedback.additionalField')}</Label>
            <Textarea
              id="feedback-additional"
              data-testid="feedback-additional-input"
              value={draft.additionalContext}
              onChange={(event) => updateDraft({ additionalContext: event.target.value })}
              placeholder={t('feedback.additionalPlaceholder')}
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">{t('feedback.diagnosticsTitle')}</p>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="pr-2">
                <p className="text-sm">{t('feedback.includeSystemInfo')}</p>
                <p className="text-xs text-muted-foreground">{t('feedback.includeSystemInfoDesc')}</p>
              </div>
              <Switch
                checked={draft.includeSystemInfo}
                onCheckedChange={setIncludeSystemInfo}
                data-testid="feedback-include-system-switch"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="pr-2">
                <p className="text-sm">{t('feedback.includeLogs')}</p>
                <p className="text-xs text-muted-foreground">{t('feedback.includeLogsDesc')}</p>
              </div>
              <Switch
                checked={draft.includeLogs}
                onCheckedChange={setIncludeLogs}
                data-testid="feedback-include-logs-switch"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t('feedback.privacyHint')}</p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyMarkdown}
              disabled={copying || submitting || exporting}
              data-testid="feedback-copy-button"
            >
              <ClipboardCopy className="h-4 w-4 mr-2" />
              {t('feedback.copyMarkdown')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadDiagnostics}
              disabled={copying || submitting || exporting}
              data-testid="feedback-download-button"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('feedback.downloadDiagnostics')}
            </Button>
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={copying || submitting || exporting}
            data-testid="feedback-submit-button"
          >
            <Send className="h-4 w-4 mr-2" />
            {t('feedback.submitToGitHub')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

