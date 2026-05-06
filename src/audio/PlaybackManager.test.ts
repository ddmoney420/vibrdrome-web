import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock CastManager so its singleton is fully controllable.
const mockCast = {
  getCurrentTime: vi.fn(() => 0),
  onSessionEnd: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn(),
  setVolume: vi.fn(),
  loadMedia: vi.fn(async () => {}),
};
vi.mock('./CastManager', () => ({
  getCastManager: () => mockCast,
  default: class {},
}));

// Mock SubsonicClient so PlaybackManager doesn't try to make real network calls.
vi.mock('../api/SubsonicClient', () => ({
  getSubsonicClient: () => ({
    stream: (id: string) => `https://example.test/stream/${id}`,
    getCoverArt: (id: string) => `https://example.test/cover/${id}`,
    scrobble: vi.fn(async () => {}),
  }),
}));

import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import PlaybackManager from './PlaybackManager';

beforeEach(() => {
  mockCast.getCurrentTime.mockReset();
  mockCast.onSessionEnd.mockReset();
  mockCast.seek.mockReset();
  mockCast.pause.mockReset();
  mockCast.play.mockReset();
  mockCast.setVolume.mockReset();
  useUIStore.setState({ castConnected: false });
});

describe('PlaybackManager cast integration', () => {
  it('registers a session-end handler with CastManager on construction', () => {
    new PlaybackManager();
    expect(mockCast.onSessionEnd).toHaveBeenCalledTimes(1);
    expect(typeof mockCast.onSessionEnd.mock.calls[0][0]).toBe('function');
  });

  it('getPosition reads from CastManager when casting', () => {
    const pm = new PlaybackManager();
    useUIStore.setState({ castConnected: true });
    mockCast.getCurrentTime.mockReturnValue(73.5);

    expect(pm.getPosition()).toBe(73.5);
  });

  it('getPosition reads from local audio when not casting', () => {
    const pm = new PlaybackManager();
    useUIStore.setState({ castConnected: false });
    mockCast.getCurrentTime.mockReturnValue(999); // should be ignored

    // Local audio currentTime defaults to 0 with no source loaded.
    expect(pm.getPosition()).toBe(0);
    expect(mockCast.getCurrentTime).not.toHaveBeenCalled();
  });

  it('seek sends to CastManager (in seconds) and skips local audio when casting', () => {
    const pm = new PlaybackManager();
    useUIStore.setState({ castConnected: true });

    pm.seek(12500);

    expect(mockCast.seek).toHaveBeenCalledWith(12.5);
    expect(usePlayerStore.getState().positionMs).toBe(12500);
  });

  it('pause delegates to CastManager when casting (does not pause local audio)', () => {
    const pm = new PlaybackManager();
    useUIStore.setState({ castConnected: true });

    pm.pause();

    expect(mockCast.pause).toHaveBeenCalledTimes(1);
  });

  it('setVolume forwards to CastManager when casting', () => {
    const pm = new PlaybackManager();
    useUIStore.setState({ castConnected: true });

    pm.setVolume(0.4);

    expect(mockCast.setVolume).toHaveBeenCalledWith(0.4);
  });
});
