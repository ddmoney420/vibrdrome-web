import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ParticleOverlay from './ParticleOverlay';

// No real audio chain. In happy-dom, canvas.getContext('2d') returns null, so
// the component takes its silent-disable path — which is exactly the
// "context unavailable" safety case we want to verify never throws.
vi.mock('../../audio/PlaybackManager', () => ({
  getPlaybackManager: () => ({ getAnalyser: () => null }),
}));

describe('ParticleOverlay', () => {
  it('renders a pointer-events-none canvas without crashing', () => {
    const { container } = render(<ParticleOverlay />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.className).toContain('pointer-events-none');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  });

  it('silently no-ops when the 2D context is unavailable (no throw)', () => {
    // happy-dom returns null from getContext('2d'); mounting must not throw.
    expect(() => render(<ParticleOverlay />)).not.toThrow();
  });

  it('unmounts cleanly without throwing', () => {
    const { unmount } = render(<ParticleOverlay />);
    expect(() => unmount()).not.toThrow();
  });

  it('does not throw when the analyser is null (no audio)', () => {
    // Analyser is mocked to null above; a mount/unmount cycle must stay clean.
    const { unmount } = render(<ParticleOverlay />);
    unmount();
    expect(true).toBe(true);
  });
});
