/**
 * Plate Solve Utility Functions
 *
 * File persistence for local solving, progress text/percent formatting
 * extracted from components/starmap/plate-solving/plate-solver-unified.tsx
 */

import type { SolveProgress } from './astrometry-api';
import type { SolveMode } from '@/types/starmap/plate-solving';

// ============================================================================
// File Persistence for Local Solve
// ============================================================================

/**
 * Persist a File to the Tauri AppCache directory for local plate solving.
 * If the File already has a native `path` property (Tauri desktop), use it directly.
 * Otherwise, write the contents into AppCache and return the full path + cleanup fn.
 */
export async function persistFileForLocalSolve(
  file: File
): Promise<{ filePath: string; cleanup: undefined | (() => Promise<void>) }> {
  const fileWithPath = file as File & { path?: string };
  if (fileWithPath.path) {
    return { filePath: fileWithPath.path, cleanup: undefined };
  }

  const { mkdir, writeFile, remove } = await import('@tauri-apps/plugin-fs');
  const { BaseDirectory, appCacheDir, join } = await import('@tauri-apps/api/path');

  const dirName = 'plate-solving';
  await mkdir(dirName, { recursive: true, baseDir: BaseDirectory.AppCache });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${safeName}`;
  const relativePath = `${dirName}/${fileName}`;

  const data = new Uint8Array(await file.arrayBuffer());
  await writeFile(relativePath, data, { baseDir: BaseDirectory.AppCache });

  const fullPath = await join(await appCacheDir(), dirName, fileName);

  return {
    filePath: fullPath,
    cleanup: async () => {
      await remove(relativePath, { baseDir: BaseDirectory.AppCache });
    },
  };
}

// ============================================================================
// Progress Formatting
// ============================================================================

/**
 * Get human-readable progress text for the online solver
 */
export function getProgressText(
  progress: SolveProgress | null,
  t: (key: string) => string
): string | undefined {
  if (!progress) return '';
  switch (progress.stage) {
    case 'uploading':
      return `${t('plateSolving.uploading') || 'Uploading'}... ${progress.progress}%`;
    case 'queued':
      return `${t('plateSolving.queued') || 'Queued'} (ID: ${progress.subid})`;
    case 'processing':
      return `${t('plateSolving.processing') || 'Processing'} (Job: ${progress.jobId})`;
    case 'success':
      return t('plateSolving.success') || 'Success!';
    case 'failed':
      return `${t('plateSolving.failed') || 'Failed'}: ${progress.error}`;
  }
}

/**
 * Calculate progress percentage for the solve operation
 */
export function getProgressPercent(
  solveMode: SolveMode,
  localProgress: number,
  progress: SolveProgress | null
): number {
  if (solveMode === 'local') return localProgress;
  if (!progress) return 0;
  switch (progress.stage) {
    case 'uploading': return progress.progress * 0.3;
    case 'queued': return 30;
    case 'processing': return 60;
    case 'success': return 100;
    case 'failed': return 100;
    default: return 0;
  }
}
