/**
 * Google Cast SDK wrapper for Chromecast integration.
 * Dynamically loads the Cast SDK and provides a simple API for casting audio.
 */

import { useUIStore } from '../stores/uiStore';

// Cast SDK types (minimal subset)
declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: {
      framework: {
        CastContext: {
          getInstance(): CastContextInstance;
        };
        SessionState: {
          SESSION_STARTED: string;
          SESSION_RESUMED: string;
          SESSION_ENDED: string;
        };
        RemotePlayerEventType: {
          IS_CONNECTED_CHANGED: string;
          CURRENT_TIME_CHANGED: string;
        };
        RemotePlayer: new () => RemotePlayer;
        RemotePlayerController: new (player: RemotePlayer) => RemotePlayerController;
      };
    };
    chrome?: {
      cast: {
        media: {
          MediaInfo: new (contentId: string, contentType: string) => MediaInfo;
          GenericMediaMetadata: new () => GenericMediaMetadata;
        };
        Image: new (url: string) => CastImage;
        AutoJoinPolicy: {
          ORIGIN_SCOPED: string;
        };
      };
    };
  }
}

interface CastContextInstance {
  setOptions(options: Record<string, unknown>): void;
  requestSession(): Promise<void>;
  endCurrentSession(stopCasting: boolean): void;
  getCurrentSession(): CastSession | null;
  addEventListener(type: string, handler: (event: { sessionState: string }) => void): void;
}

interface CastSession {
  loadMedia(request: { media: MediaInfo }): Promise<void>;
  getMediaSession(): MediaSession | null;
}

interface MediaSession {
  play(): void;
  pause(): void;
  seek(request: { currentTime: number }): void;
  setVolume(request: { volume: { level: number } }): void;
  getEstimatedTime(): number;
}

interface MediaInfo {
  metadata: GenericMediaMetadata | null;
}

interface GenericMediaMetadata {
  title: string;
  subtitle: string;
  images: CastImage[];
}

interface CastImage {
  url: string;
}

interface RemotePlayer {
  isConnected: boolean;
  currentTime: number;
}

interface RemotePlayerController {
  addEventListener(type: string, handler: () => void): void;
}

const DEFAULT_RECEIVER_APP_ID = 'CC1AD845'; // Default Media Receiver

class CastManager {
  private castContext: CastContextInstance | null = null;
  private sdkLoaded = false;
  private sdkFailed = false;
  private loadPromise: Promise<boolean> | null = null;
  private remotePlayer: RemotePlayer | null = null;
  private remotePlayerController: RemotePlayerController | null = null;
  private lastKnownTimeSec = 0;
  private sessionEndCallback: ((lastPositionMs: number) => void) | null = null;

  /**
   * Dynamically load the Google Cast SDK.
   * Returns true if SDK loaded successfully, false otherwise.
   */
  loadSdk(): Promise<boolean> {
    if (this.sdkLoaded) return Promise.resolve(true);
    if (this.sdkFailed) return Promise.resolve(false);
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve) => {
      // Set up callback before loading script
      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        if (isAvailable && window.cast && window.chrome?.cast) {
          this.sdkLoaded = true;
          this.initContext();
          resolve(true);
        } else {
          this.sdkFailed = true;
          resolve(false);
        }
      };

      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
      script.onerror = () => {
        this.sdkFailed = true;
        resolve(false);
      };
      // Timeout after 5s
      const timeout = setTimeout(() => {
        if (!this.sdkLoaded) {
          this.sdkFailed = true;
          resolve(false);
        }
      }, 5000);
      script.onload = () => clearTimeout(timeout);
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  private initContext(): void {
    if (!window.cast || !window.chrome?.cast) return;

    this.castContext = window.cast.framework.CastContext.getInstance();
    this.castContext.setOptions({
      receiverApplicationId: DEFAULT_RECEIVER_APP_ID,
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    // Track currentTime so we can hand the last-known position to PlaybackManager
    // when a session ends (the MediaSession is gone by then).
    this.remotePlayer = new window.cast.framework.RemotePlayer();
    this.remotePlayerController = new window.cast.framework.RemotePlayerController(this.remotePlayer);
    const RemotePlayerEventType = window.cast.framework.RemotePlayerEventType;
    this.remotePlayerController.addEventListener(
      RemotePlayerEventType.CURRENT_TIME_CHANGED,
      () => {
        if (this.remotePlayer) {
          this.lastKnownTimeSec = this.remotePlayer.currentTime;
        }
      },
    );

    // Listen for session state changes
    const SessionState = window.cast.framework.SessionState;
    this.castContext.addEventListener('sessionstatechanged', (event) => {
      const connected =
        event.sessionState === SessionState.SESSION_STARTED ||
        event.sessionState === SessionState.SESSION_RESUMED;
      useUIStore.getState().setCastConnected(connected);

      if (event.sessionState === SessionState.SESSION_ENDED && this.sessionEndCallback) {
        const lastMs = Math.round(this.lastKnownTimeSec * 1000);
        this.sessionEndCallback(lastMs);
      }
    });
  }

  isAvailable(): boolean {
    return this.sdkLoaded && !this.sdkFailed;
  }

  isConnected(): boolean {
    return useUIStore.getState().castConnected;
  }

  async requestSession(): Promise<void> {
    if (!this.castContext) return;
    try {
      await this.castContext.requestSession();
    } catch {
      // User cancelled or error
    }
  }

  endSession(): void {
    if (!this.castContext) return;
    this.castContext.endCurrentSession(true);
    useUIStore.getState().setCastConnected(false);
  }

  async loadMedia(streamUrl: string, title: string, artist: string, album: string, artUrl?: string): Promise<void> {
    if (!this.castContext || !window.chrome?.cast) return;

    const session = this.castContext.getCurrentSession();
    if (!session) return;

    const mediaInfo = new window.chrome.cast.media.MediaInfo(streamUrl, 'audio/mpeg');
    const metadata = new window.chrome.cast.media.GenericMediaMetadata();
    metadata.title = title;
    metadata.subtitle = `${artist} — ${album}`;
    if (artUrl) {
      metadata.images = [new window.chrome.cast.Image(artUrl)];
    }
    mediaInfo.metadata = metadata;

    await session.loadMedia({ media: mediaInfo });
  }

  play(): void {
    const session = this.castContext?.getCurrentSession();
    session?.getMediaSession()?.play();
  }

  pause(): void {
    const session = this.castContext?.getCurrentSession();
    session?.getMediaSession()?.pause();
  }

  seek(timeSeconds: number): void {
    const session = this.castContext?.getCurrentSession();
    session?.getMediaSession()?.seek({ currentTime: timeSeconds });
  }

  setVolume(level: number): void {
    const session = this.castContext?.getCurrentSession();
    session?.getMediaSession()?.setVolume({ volume: { level } });
  }

  /** Current cast playback position in seconds. Returns 0 when no media session is active. */
  getCurrentTime(): number {
    const session = this.castContext?.getCurrentSession();
    const media = session?.getMediaSession();
    if (media) {
      try {
        const t = media.getEstimatedTime();
        if (typeof t === 'number' && !isNaN(t)) return t;
      } catch { /* fall through to last-known */ }
    }
    return this.lastKnownTimeSec;
  }

  /** Register a handler invoked when the cast session ends, with the last observed position in ms. */
  onSessionEnd(callback: ((lastPositionMs: number) => void) | null): void {
    this.sessionEndCallback = callback;
  }
}

// Singleton
let instance: CastManager | null = null;

export function getCastManager(): CastManager {
  if (!instance) {
    instance = new CastManager();
  }
  return instance;
}

export default CastManager;
