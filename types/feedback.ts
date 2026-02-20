/**
 * Feedback domain types.
 */

export type FeedbackType = 'bug' | 'feature';

export interface FeedbackDraft {
  type: FeedbackType;
  title: string;
  description: string;
  reproductionSteps: string;
  expectedBehavior: string;
  additionalContext: string;
  includeSystemInfo: boolean;
  includeLogs: boolean;
}

export interface FeedbackDiagnostics {
  generatedAt: string;
  app: {
    name: string;
    version: string;
    buildDate: string;
    environment: 'tauri' | 'web';
    locale?: string;
    href?: string;
    userAgent?: string;
  };
  system?: {
    os?: string;
    arch?: string;
    tauriVersion?: string;
    appVersion?: string;
    platform?: string;
    hardwareConcurrency?: number;
    language?: string;
  };
  logs?: string;
}

export interface FeedbackSubmissionPayload {
  draft: FeedbackDraft;
  diagnostics?: FeedbackDiagnostics | null;
  labels?: string[];
}

export interface FeedbackUrlBuildResult {
  url: string;
  markdownBody: string;
  truncated: boolean;
  diagnosticsIncluded: boolean;
  estimatedLength: number;
  fallbackNote?: string;
}
