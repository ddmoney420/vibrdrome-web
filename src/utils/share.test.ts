import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shareUrl } from './share';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('shareUrl', () => {
  it('uses Web Share API when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    await shareUrl('Test Title', 'https://example.com');

    expect(mockShare).toHaveBeenCalledWith({
      title: 'Test Title',
      url: 'https://example.com',
    });
  });

  it('falls back to clipboard when share not available', async () => {
    // Remove share API
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    await shareUrl('Test', 'https://example.com');

    expect(mockWriteText).toHaveBeenCalledWith('https://example.com');
  });

  it('uses current URL when no URL provided', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    await shareUrl('Test');

    expect(mockWriteText).toHaveBeenCalledWith(window.location.href);
  });
});
