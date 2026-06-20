import { describe, it, expect, vi } from 'vitest';
import { shouldCrossfade, captureSnapshot } from './presetCrossfade';

describe('shouldCrossfade', () => {
  const base = { transition: 'fade' as const, motionReduced: false, armed: true, hasCanvas: true };

  it('default hard-cut never crossfades', () => {
    expect(shouldCrossfade({ ...base, transition: 'hard-cut' })).toBe(false);
  });

  it('reduced motion suppresses the fade', () => {
    expect(shouldCrossfade({ ...base, motionReduced: true })).toBe(false);
  });

  it('does not fade before a previous preset has rendered (not armed)', () => {
    expect(shouldCrossfade({ ...base, armed: false })).toBe(false);
  });

  it('does not fade without a canvas', () => {
    expect(shouldCrossfade({ ...base, hasCanvas: false })).toBe(false);
  });

  it('fades when enabled, armed, has a canvas, and motion is not reduced', () => {
    expect(shouldCrossfade(base)).toBe(true);
  });
});

describe('captureSnapshot', () => {
  const canvasWith = (toDataURL: HTMLCanvasElement['toDataURL']) => ({ toDataURL }) as unknown as HTMLCanvasElement;

  it('returns the data URL when capture succeeds', () => {
    const canvas = canvasWith(() => 'data:image/jpeg;base64,abc');
    const cb = vi.fn();
    captureSnapshot(canvas, cb);
    expect(cb).toHaveBeenCalledWith('data:image/jpeg;base64,abc');
  });

  it('passes the JPEG mime + quality to toDataURL', () => {
    const toDataURL = vi.fn(() => 'data:image/jpeg;base64,abc');
    captureSnapshot(canvasWith(toDataURL as unknown as HTMLCanvasElement['toDataURL']), () => {}, 0.55);
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.55);
  });

  it('falls back (null) when toDataURL returns a non-image string', () => {
    const canvas = canvasWith(() => 'data:,'); // e.g. blank/unsupported
    const cb = vi.fn();
    captureSnapshot(canvas, cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('falls back (null) when toDataURL throws (e.g. tainted/unsupported)', () => {
    const canvas = canvasWith(() => { throw new Error('no'); });
    const cb = vi.fn();
    captureSnapshot(canvas, cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('calls back exactly once', () => {
    const canvas = canvasWith(() => 'data:image/jpeg;base64,abc');
    const cb = vi.fn();
    captureSnapshot(canvas, cb);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
