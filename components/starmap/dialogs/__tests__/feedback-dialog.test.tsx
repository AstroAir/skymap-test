/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FeedbackDialog } from '../feedback-dialog';
import { useFeedbackStore } from '@/lib/stores/feedback-store';

const mockOpenExternalUrl = jest.fn();
const mockCollectDiagnostics = jest.fn();
const mockBuildGitHubIssueUrl = jest.fn();
const mockBuildIssueBodyMarkdown = jest.fn();
const mockExportDiagnosticsBundle = jest.fn();

jest.mock('@/lib/tauri/app-control-api', () => ({
  openExternalUrl: (url: string) => mockOpenExternalUrl(url),
}));

jest.mock('@/lib/feedback/feedback-utils', () => ({
  collectDiagnostics: (...args: unknown[]) => mockCollectDiagnostics(...args),
  buildGitHubIssueUrl: (...args: unknown[]) => mockBuildGitHubIssueUrl(...args),
  buildIssueBodyMarkdown: (...args: unknown[]) => mockBuildIssueBodyMarkdown(...args),
  exportDiagnosticsBundle: (...args: unknown[]) => mockExportDiagnosticsBundle(...args),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('FeedbackDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeedbackStore.setState({
      draft: {
        type: 'bug',
        title: '',
        description: '',
        reproductionSteps: '',
        expectedBehavior: '',
        additionalContext: '',
        includeSystemInfo: false,
        includeLogs: false,
      },
      preferences: {
        includeSystemInfo: false,
        includeLogs: false,
      },
    });
    mockCollectDiagnostics.mockResolvedValue(null);
    mockBuildIssueBodyMarkdown.mockReturnValue('## Summary');
    mockBuildGitHubIssueUrl.mockReturnValue({
      url: 'https://github.com/AstroAir/skymap-test/issues/new?template=bug_report.yml',
      markdownBody: '## Summary',
      truncated: false,
      diagnosticsIncluded: false,
      estimatedLength: 120,
    });
    mockExportDiagnosticsBundle.mockResolvedValue('skymap-diagnostics.json');
  });

  it('requires required fields before submit', async () => {
    render(<FeedbackDialog open onOpenChange={jest.fn()} />);

    fireEvent.click(screen.getByTestId('feedback-submit-button'));

    await waitFor(() => {
      expect(mockOpenExternalUrl).not.toHaveBeenCalled();
    });
  });

  it('keeps diagnostics switches disabled by default', () => {
    render(<FeedbackDialog open onOpenChange={jest.fn()} />);

    expect(screen.getByTestId('feedback-include-system-switch')).toHaveAttribute('data-state', 'unchecked');
    expect(screen.getByTestId('feedback-include-logs-switch')).toHaveAttribute('data-state', 'unchecked');
  });

  it('collects diagnostics and opens GitHub issue URL on submit', async () => {
    render(<FeedbackDialog open onOpenChange={jest.fn()} />);

    fireEvent.change(screen.getByTestId('feedback-title-input'), { target: { value: 'Test bug title' } });
    fireEvent.change(screen.getByTestId('feedback-description-input'), { target: { value: 'Bug description' } });
    fireEvent.change(screen.getByTestId('feedback-steps-input'), { target: { value: '1. Step one' } });
    fireEvent.change(screen.getByTestId('feedback-expected-input'), { target: { value: 'Expected result' } });

    fireEvent.click(screen.getByTestId('feedback-include-system-switch'));
    fireEvent.click(screen.getByTestId('feedback-include-logs-switch'));

    mockCollectDiagnostics.mockResolvedValue({
      generatedAt: '2026-02-20T00:00:00.000Z',
      app: {
        name: 'SkyMap',
        version: '0.1.0',
        buildDate: '2026-02-20',
        environment: 'web',
      },
      logs: 'sample logs',
    });

    fireEvent.click(screen.getByTestId('feedback-submit-button'));

    await waitFor(() => {
      expect(mockCollectDiagnostics).toHaveBeenCalledWith({
        includeSystemInfo: true,
        includeLogs: true,
      });
      expect(mockBuildGitHubIssueUrl).toHaveBeenCalled();
      expect(mockOpenExternalUrl).toHaveBeenCalledWith(
        'https://github.com/AstroAir/skymap-test/issues/new?template=bug_report.yml'
      );
    });
  });

  it('exports diagnostics bundle when user clicks download', async () => {
    useFeedbackStore.setState((state) => ({
      draft: { ...state.draft, includeSystemInfo: true, includeLogs: false },
      preferences: { ...state.preferences, includeSystemInfo: true, includeLogs: false },
    }));

    render(<FeedbackDialog open onOpenChange={jest.fn()} />);
    mockCollectDiagnostics.mockResolvedValue({
      generatedAt: '2026-02-20T00:00:00.000Z',
      app: {
        name: 'SkyMap',
        version: '0.1.0',
        buildDate: '2026-02-20',
        environment: 'web',
      },
    });

    fireEvent.click(screen.getByTestId('feedback-download-button'));

    await waitFor(() => {
      expect(mockCollectDiagnostics).toHaveBeenCalledWith({
        includeSystemInfo: true,
        includeLogs: false,
      });
      expect(mockExportDiagnosticsBundle).toHaveBeenCalled();
    });
  });
});
