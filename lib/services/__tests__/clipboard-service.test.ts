/**
 * @jest-environment jsdom
 */

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

jest.mock('@/lib/tauri/clipboard-api', () => ({
  clipboardApi: {
    isAvailable: jest.fn(() => true),
    writeText: jest.fn(),
    readText: jest.fn(),
    writeHtml: jest.fn(),
    writeImage: jest.fn(),
    readImage: jest.fn(),
    clear: jest.fn(),
  },
}));

import { isTauri } from '@/lib/storage/platform';
import { clipboardApi } from '@/lib/tauri/clipboard-api';
import {
  clipboardService,
  ClipboardPermissionError,
  ClipboardUnavailableError,
  ClipboardUnsupportedError,
} from '../clipboard-service';

const mockIsTauri = isTauri as jest.Mock;
const mockClipboardApi = clipboardApi as jest.Mocked<typeof clipboardApi>;

type MockClipboardItemRecord = Record<string, Blob>;

class MockClipboardItem {
  private readonly data: MockClipboardItemRecord;

  constructor(data: MockClipboardItemRecord) {
    this.data = data;
  }

  get types(): string[] {
    return Object.keys(this.data);
  }

  async getType(type: string): Promise<Blob> {
    const value = this.data[type];
    if (!value) {
      throw new Error(`Missing clipboard type: ${type}`);
    }
    return value;
  }
}

function setNavigatorClipboard(
  clipboard: Partial<Record<keyof Clipboard, unknown>> | undefined
): void {
  Object.defineProperty(global.navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: clipboard as Clipboard | undefined,
  });
}

describe('clipboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(false);
    (
      globalThis as typeof globalThis & {
        ClipboardItem: typeof ClipboardItem;
      }
    ).ClipboardItem = MockClipboardItem as unknown as typeof ClipboardItem;
    setNavigatorClipboard({
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue('plain text'),
      write: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue([]),
    });
  });

  it('routes writeText to browser clipboard in web runtime', async () => {
    await clipboardService.writeText('hello');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
    expect(mockClipboardApi.writeText).not.toHaveBeenCalled();
  });

  it('routes writeText to tauri clipboard API in tauri runtime', async () => {
    mockIsTauri.mockReturnValue(true);
    mockClipboardApi.writeText.mockResolvedValue(undefined);

    await clipboardService.writeText('desktop');

    expect(mockClipboardApi.writeText).toHaveBeenCalledWith('desktop');
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('falls back to readText when rich read API is unavailable', async () => {
    (globalThis as unknown as { ClipboardItem?: unknown }).ClipboardItem = undefined;
    const readText = jest.fn().mockResolvedValue('<b>hello</b>');
    setNavigatorClipboard({
      ...navigator.clipboard,
      readText,
      read: undefined,
    });

    await expect(clipboardService.readHtml()).resolves.toBe('<b>hello</b>');
    expect(readText).toHaveBeenCalled();
  });

  it('writes empty text when clearing browser clipboard', async () => {
    await clipboardService.clear();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
  });

  it('throws ClipboardUnsupportedError when browser image write API is unavailable', async () => {
    const globalWithClipboard = globalThis as unknown as { ClipboardItem?: typeof ClipboardItem };
    globalWithClipboard.ClipboardItem = undefined;

    await expect(clipboardService.writeImage(new Uint8Array([1, 2, 3]))).rejects.toBeInstanceOf(
      ClipboardUnsupportedError
    );
  });

  it('normalizes tauri readImage result shape', async () => {
    mockIsTauri.mockReturnValue(true);
    mockClipboardApi.readImage.mockResolvedValue({
      rgba: new Uint8Array([1, 2, 3, 4]),
      width: 1,
      height: 1,
    });

    await expect(clipboardService.readImage()).resolves.toEqual({
      bytes: new Uint8Array([1, 2, 3, 4]),
      width: 1,
      height: 1,
      mimeType: 'image/raw+rgba',
    });
  });

  it('maps NotAllowedError to ClipboardPermissionError', async () => {
    const deniedWrite = jest
      .fn()
      .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    setNavigatorClipboard({
      ...navigator.clipboard,
      writeText: deniedWrite,
    });

    await expect(clipboardService.writeText('denied')).rejects.toBeInstanceOf(
      ClipboardPermissionError
    );
  });

  it('maps tauri capability permission failures to ClipboardPermissionError', async () => {
    mockIsTauri.mockReturnValue(true);
    mockClipboardApi.writeText.mockRejectedValue(
      new Error('permission denied by capability configuration')
    );

    await expect(clipboardService.writeText('desktop-denied')).rejects.toBeInstanceOf(
      ClipboardPermissionError
    );
  });

  it('throws ClipboardUnavailableError when clipboard API is missing', async () => {
    setNavigatorClipboard(undefined);

    await expect(clipboardService.writeText('missing')).rejects.toBeInstanceOf(
      ClipboardUnavailableError
    );
  });
});
