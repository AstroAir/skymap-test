import { toast } from 'sonner';
import { clipboardService } from '@/lib/services/clipboard-service';

export interface CopyTextWithFeedbackOptions {
  text: string;
  successMessage: string;
  errorMessage: string;
  successDescription?: string;
  errorDescription?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export async function copyTextWithFeedback(options: CopyTextWithFeedbackOptions): Promise<boolean> {
  try {
    await clipboardService.writeText(options.text);
    toast.success(options.successMessage, {
      description: options.successDescription,
    });
    options.onSuccess?.();
    return true;
  } catch (error) {
    toast.error(options.errorMessage, {
      description: options.errorDescription,
    });
    options.onError?.(error);
    return false;
  }
}
