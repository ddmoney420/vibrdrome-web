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

    // Listen for session state changes
    const SessionState = window.cast.framework.SessionState;
    this.castContext.addEventListener('sessionstatechanged', (event) => {
      const connected =
        event.sessionState === SessionState.SESSION_STARTED ||
        event.sessionState === SessionState.SESSION_RESUMED;
      useUIStore.getState().setCastConnected(connected);
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
