import { isTauri } from '@/lib/storage/platform';
import {
  clipboardApi,
  type TauriClipboardImageInput,
  type TauriClipboardImageData,
} from '@/lib/tauri/clipboard-api';
import type { Image as TauriImage } from '@tauri-apps/api/image';

type ClipboardOperation =
  | 'writeText'
  | 'readText'
  | 'writeHtml'
  | 'readHtml'
  | 'writeImage'
  | 'readImage'
  | 'clear';

export class ClipboardUnavailableError extends Error {
  constructor(public readonly operation: ClipboardOperation, cause?: unknown) {
    super(`Clipboard is unavailable for operation "${operation}"`);
    this.name = 'ClipboardUnavailableError';
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

export class ClipboardPermissionError extends Error {
  constructor(public readonly operation: ClipboardOperation, cause?: unknown) {
    super(`Clipboard permission denied for operation "${operation}"`);
    this.name = 'ClipboardPermissionError';
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

export class ClipboardUnsupportedError extends Error {
  constructor(public readonly operation: ClipboardOperation, message: string) {
    super(message);
    this.name = 'ClipboardUnsupportedError';
  }
}

export class ClipboardOperationError extends Error {
  constructor(public readonly operation: ClipboardOperation, cause?: unknown) {
    super(`Clipboard operation "${operation}" failed`);
    this.name = 'ClipboardOperationError';
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

export type ClipboardImageInput =
  | TauriClipboardImageInput
  | Blob
  | ImageData
  | TauriImage;

export interface ClipboardImageData {
  bytes: Uint8Array;
  width?: number;
  height?: number;
  mimeType: string;
}

function ensureClipboard(operation: ClipboardOperation): Clipboard {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    throw new ClipboardUnavailableError(operation);
  }
  return navigator.clipboard;
}

function normalizeClipboardError(operation: ClipboardOperation, error: unknown): Error {
  if (
    error instanceof ClipboardUnavailableError ||
    error instanceof ClipboardPermissionError ||
    error instanceof ClipboardUnsupportedError ||
    error instanceof ClipboardOperationError
  ) {
    return error;
  }

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return new ClipboardPermissionError(operation, error);
    }
    return new ClipboardOperationError(operation, error);
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/permission|denied|not allowed|security/i.test(message)) {
    return new ClipboardPermissionError(operation, error);
  }
  if (/not supported|unsupported|unavailable|not available/i.test(message)) {
    return new ClipboardUnsupportedError(operation, message);
  }
  return new ClipboardOperationError(operation, error);
}

async function withClipboardError<T>(
  operation: ClipboardOperation,
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw normalizeClipboardError(operation, error);
  }
}

function htmlToPlainText(html: string): string {
  if (typeof DOMParser === 'undefined') {
    return html;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || html;
}

function isTauriImageLike(value: unknown): value is TauriImage {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { rgba?: unknown; size?: unknown };
  return typeof candidate.rgba === 'function' && typeof candidate.size === 'function';
}

async function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw new ClipboardUnsupportedError('writeImage', 'Canvas APIs are unavailable in this environment');
  }

  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new ClipboardOperationError('writeImage');
  }
  context.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });

  if (!blob) {
    throw new ClipboardOperationError('writeImage');
  }
  return blob;
}

async function tauriImageToBlob(image: TauriImage): Promise<Blob> {
  const [rgba, size] = await Promise.all([image.rgba(), image.size()]);
  const imageData = new ImageData(new Uint8ClampedArray(rgba), size.width, size.height);
  return imageDataToBlob(imageData);
}

async function toBrowserImageBlob(image: ClipboardImageInput): Promise<Blob> {
  if (image instanceof Blob) {
    return image;
  }

  if (typeof ImageData !== 'undefined' && image instanceof ImageData) {
    return imageDataToBlob(image);
  }

  if (typeof image === 'string') {
    if (!/^data:image\/|^blob:|^https?:\/\//.test(image)) {
      throw new ClipboardUnsupportedError('writeImage', 'String image input must be a valid image URL or data URL');
    }
    const response = await fetch(image);
    return response.blob();
  }

  if (image instanceof ArrayBuffer) {
    return new Blob([new Uint8Array(image)], { type: 'image/png' });
  }

  if (image instanceof Uint8Array || Array.isArray(image)) {
    const bytes = Uint8Array.from(image);
    return new Blob([bytes.buffer], { type: 'image/png' });
  }

  if (isTauriImageLike(image)) {
    return tauriImageToBlob(image);
  }

  throw new ClipboardUnsupportedError('writeImage', 'Unsupported image input format');
}

function normalizeTauriImageData(image: TauriClipboardImageData): ClipboardImageData {
  return {
    bytes: image.rgba,
    width: image.width,
    height: image.height,
    mimeType: 'image/raw+rgba',
  };
}

async function writeImageBrowser(image: ClipboardImageInput): Promise<void> {
  const clipboard = ensureClipboard('writeImage');
  if (typeof clipboard.write !== 'function' || typeof ClipboardItem === 'undefined') {
    throw new ClipboardUnsupportedError('writeImage', 'Clipboard image write is not supported in this browser');
  }

  const blob = await toBrowserImageBlob(image);
  const type = blob.type || 'image/png';
  await clipboard.write([new ClipboardItem({ [type]: blob })]);
}

async function readImageBrowser(): Promise<ClipboardImageData> {
  const clipboard = ensureClipboard('readImage');
  if (typeof clipboard.read !== 'function' || typeof ClipboardItem === 'undefined') {
    throw new ClipboardUnsupportedError('readImage', 'Clipboard image read is not supported in this browser');
  }

  const items = await clipboard.read();
  for (const item of items) {
    const imageType = item.types.find((type) => type.startsWith('image/'));
    if (!imageType) {
      continue;
    }
    const blob = await item.getType(imageType);
    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      mimeType: imageType,
    };
  }

  throw new ClipboardUnsupportedError('readImage', 'Clipboard does not contain image data');
}

async function readHtmlBrowser(): Promise<string> {
  const clipboard = ensureClipboard('readHtml');
  if (typeof clipboard.read !== 'function' || typeof ClipboardItem === 'undefined') {
    return clipboard.readText();
  }

  const items = await clipboard.read();
  for (const item of items) {
    if (item.types.includes('text/html')) {
      const htmlBlob = await item.getType('text/html');
      return htmlBlob.text();
    }
  }
  return clipboard.readText();
}

async function writeHtmlBrowser(html: string, altText?: string): Promise<void> {
  const clipboard = ensureClipboard('writeHtml');
  const fallbackText = altText || htmlToPlainText(html);

  if (typeof clipboard.write !== 'function' || typeof ClipboardItem === 'undefined') {
    await clipboard.writeText(fallbackText);
    return;
  }

  await clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([fallbackText], { type: 'text/plain' }),
    }),
  ]);
}

function toTauriImageInput(image: ClipboardImageInput): TauriClipboardImageInput {
  if (image instanceof Blob || (typeof ImageData !== 'undefined' && image instanceof ImageData)) {
    throw new ClipboardUnsupportedError(
      'writeImage',
      'Use Uint8Array, ArrayBuffer, number[], Image, or URL string for Tauri clipboard images'
    );
  }
  return image as TauriClipboardImageInput;
}

export const clipboardService = {
  isAvailable(): boolean {
    if (isTauri()) {
      return clipboardApi.isAvailable();
    }
    return typeof navigator !== 'undefined' && !!navigator.clipboard;
  },

  async writeText(text: string): Promise<void> {
    return withClipboardError('writeText', async () => {
      if (isTauri()) {
        await clipboardApi.writeText(text);
        return;
      }
      const clipboard = ensureClipboard('writeText');
      await clipboard.writeText(text);
    });
  },

  async readText(): Promise<string> {
    return withClipboardError('readText', async () => {
      if (isTauri()) {
        return clipboardApi.readText();
      }
      const clipboard = ensureClipboard('readText');
      return clipboard.readText();
    });
  },

  async writeHtml(html: string, altText?: string): Promise<void> {
    return withClipboardError('writeHtml', async () => {
      if (isTauri()) {
        await clipboardApi.writeHtml(html, altText);
        return;
      }
      await writeHtmlBrowser(html, altText);
    });
  },

  async readHtml(): Promise<string> {
    return withClipboardError('readHtml', async () => {
      if (isTauri()) {
        return clipboardApi.readText();
      }
      return readHtmlBrowser();
    });
  },

  async writeImage(image: ClipboardImageInput): Promise<void> {
    return withClipboardError('writeImage', async () => {
      if (isTauri()) {
        await clipboardApi.writeImage(toTauriImageInput(image));
        return;
      }
      await writeImageBrowser(image);
    });
  },

  async readImage(): Promise<ClipboardImageData> {
    return withClipboardError('readImage', async () => {
      if (isTauri()) {
        const image = await clipboardApi.readImage();
        return normalizeTauriImageData(image);
      }
      return readImageBrowser();
    });
  },

  async clear(): Promise<void> {
    return withClipboardError('clear', async () => {
      if (isTauri()) {
        await clipboardApi.clear();
        return;
      }
      const clipboard = ensureClipboard('clear');
      await clipboard.writeText('');
    });
  },
};
