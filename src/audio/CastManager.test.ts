import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CastManager from './CastManager';

// Minimal Cast SDK stub that lets us drive currentTime updates and session lifecycle.
function installFakeCastSdk() {
  const sessionStateHandlers: Array<(event: { sessionState: string }) => void> = [];
  const timeChangedHandlers: Array<() => void> = [];
  const remotePlayer = { isConnected: false, currentTime: 0 };
  const mediaSession = {
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    getEstimatedTime: vi.fn(() => 0),
  };
  const session = {
    loadMedia: vi.fn(async () => {}),
    getMediaSession: vi.fn(() => mediaSession),
  };
  let currentSession: typeof session | null = session;

  const castContext = {
    setOptions: vi.fn(),
    requestSession: vi.fn(async () => {}),
    endCurrentSession: vi.fn(),
    getCurrentSession: () => currentSession,
    addEventListener: (type: string, handler: (event: { sessionState: string }) => void) => {
      if (type === 'sessionstatechanged') sessionStateHandlers.push(handler);
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).cast = {
    framework: {
      CastContext: { getInstance: () => castContext },
      SessionState: {
        SESSION_STARTED: 'SESSION_STARTED',
        SESSION_RESUMED: 'SESSION_RESUMED',
        SESSION_ENDED: 'SESSION_ENDED',
      },
      RemotePlayerEventType: {
        IS_CONNECTED_CHANGED: 'isConnectedChanged',
        CURRENT_TIME_CHANGED: 'currentTimeChanged',
      },
      RemotePlayer: function () { return remotePlayer; },
      RemotePlayerController: function () {
        return {
          addEventListener: (type: string, handler: () => void) => {
            if (type === 'currentTimeChanged') timeChangedHandlers.push(handler);
          },
        };
      },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).chrome = {
    cast: {
      media: {
        MediaInfo: function () { return {}; },
        GenericMediaMetadata: function () { return {}; },
      },
      Image: function () { return {}; },
      AutoJoinPolicy: { ORIGIN_SCOPED: 'origin_scoped' },
    },
  };

  return {
    sessionStateHandlers,
    timeChangedHandlers,
    remotePlayer,
    mediaSession,
    fireTimeChange: (newTimeSec: number) => {
      remotePlayer.currentTime = newTimeSec;
      timeChangedHandlers.forEach((h) => h());
    },
    fireSessionEnded: () => {
      sessionStateHandlers.forEach((h) => h({ sessionState: 'SESSION_ENDED' }));
    },
    setSession: (next: typeof session | null) => { currentSession = next; },
  };
}

async function loadAndInit(cm: CastManager): Promise<void> {
  const promise = cm.loadSdk();
  // Trigger the SDK-ready callback synchronously instead of waiting on a real script load.
  window.__onGCastApiAvailable?.(true);
  await promise;
}

describe('CastManager', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).cast = undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).chrome = undefined;
    delete window.__onGCastApiAvailable;
    // Silence happy-dom's "JavaScript file loading is disabled" noise — we trigger
    // the SDK-ready callback manually so the real script never needs to load.
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentTime', () => {
    it('returns 0 when no session is active', () => {
      const cm = new CastManager();
      expect(cm.getCurrentTime()).toBe(0);
    });

    it('returns the media session estimated time', async () => {
      const sdk = installFakeCastSdk();
      sdk.mediaSession.getEstimatedTime.mockReturnValue(42.5);

      const cm = new CastManager();
      await loadAndInit(cm);

      expect(cm.getCurrentTime()).toBe(42.5);
    });

    it('falls back to last-known time when media session getEstimatedTime throws', async () => {
      const sdk = installFakeCastSdk();
      sdk.mediaSession.getEstimatedTime.mockImplementation(() => { throw new Error('boom'); });

      const cm = new CastManager();
      await loadAndInit(cm);
      sdk.fireTimeChange(17.25); // remember 17.25s via CURRENT_TIME_CHANGED

      expect(cm.getCurrentTime()).toBe(17.25);
    });

    it('falls back to last-known time when no media session is present', async () => {
      const sdk = installFakeCastSdk();

      const cm = new CastManager();
      await loadAndInit(cm);
      sdk.fireTimeChange(8);
      sdk.setSession(null);

      expect(cm.getCurrentTime()).toBe(8);
    });
  });

  describe('onSessionEnd', () => {
    it('fires the registered callback with the last-observed position in ms', async () => {
      const sdk = installFakeCastSdk();

      const cm = new CastManager();
      await loadAndInit(cm);

      const callback = vi.fn();
      cm.onSessionEnd(callback);

      sdk.fireTimeChange(34.789);
      sdk.fireSessionEnded();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(34789); // 34.789s rounded to 34789ms
    });

    it('does nothing when no callback is registered', async () => {
      const sdk = installFakeCastSdk();
      const cm = new CastManager();
      await loadAndInit(cm);

      // Should not throw
      expect(() => sdk.fireSessionEnded()).not.toThrow();
    });

    it('passes 0 when no time updates have been observed', async () => {
      const sdk = installFakeCastSdk();
      const cm = new CastManager();
      await loadAndInit(cm);

      const callback = vi.fn();
      cm.onSessionEnd(callback);
      sdk.fireSessionEnded();

      expect(callback).toHaveBeenCalledWith(0);
    });
  });
});
