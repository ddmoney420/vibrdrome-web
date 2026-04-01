import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { useEQStore } from '../stores/eqStore';
import type { Song } from '../types/subsonic';

const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_Q = 1.414;
const POSITION_UPDATE_MS = 250;
const SCROBBLE_MIN_SECONDS = 30;
const SCROBBLE_PERCENT = 0.5;
const SLEEP_FADE_SECONDS = 10;

class PlaybackManager {
  private audioContext: AudioContext | null = null;
  private playerA: HTMLAudioElement;
  private playerB: HTMLAudioElement;
  private activePlayer: 'A' | 'B' = 'A';
  private sourceA: MediaElementAudioSourceNode | null = null;
  private sourceB: MediaElementAudioSourceNode | null = null;
  private gainA: GainNode | null = null;
  private gainB: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  private positionInterval: number | null = null;
  private scrobbled = false;
  private crossfadeTimer: number | null = null;
  private crossfading = false;
  private sleepTimerId: number | null = null;
  private sleepFadeInterval: number | null = null;
  private sleepRemainingMs = 0;
  private currentVolume = 1;
  private previousVolume = 1;
  private playId = 0;
  private unsubscribeEQ: (() => void) | null = null;

  constructor() {
    this.playerA = new Audio();
    this.playerB = new Audio();
    this.playerA.preload = 'auto';
    this.playerB.preload = 'auto';
    this.playerA.crossOrigin = 'anonymous';
    this.playerB.crossOrigin = 'anonymous';

    // Handle track ended events
    this.playerA.addEventListener('ended', () => this.handleTrackEnded('A'));
    this.playerB.addEventListener('ended', () => this.handleTrackEnded('B'));

    // Handle errors
    this.playerA.addEventListener('error', () => this.handleError('A'));
    this.playerB.addEventListener('error', () => this.handleError('B'));

    // Handle duration metadata
    this.playerA.addEventListener('loadedmetadata', () => this.handleMetadata('A'));
    this.playerB.addEventListener('loadedmetadata', () => this.handleMetadata('B'));
  }

  /** Call from a user gesture to ensure AudioContext is running before async work. */
  warmup(): void {
    this.ensureAudioContext();
  }

  /** Create AudioContext if needed and resume if suspended. */
  private ensureAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /** Connect audio elements to Web Audio graph (for EQ, visualizer). Lazy — called after first play. */
  private ensureAudioChain(): void {
    if (this.sourceA) return; // Already connected

    this.ensureAudioContext();
    this.setupAudioChain();

    // Subscribe to EQ store changes (only once)
    if (!this.unsubscribeEQ) {
      this.unsubscribeEQ = useEQStore.subscribe((state) => {
        this.updateEQ(state.bands, state.enabled);
      });
    }

    // Apply current EQ state
    const eqState = useEQStore.getState();
    this.updateEQ(eqState.bands, eqState.enabled);
  }

  init(): void {
    this.ensureAudioChain();
  }

  async play(song: Song): Promise<void> {
    // Guard against rapid-fire calls (e.g. clicking next repeatedly)
    const thisPlayId = ++this.playId;

    // Cancel any active crossfade
    this.cancelCrossfade();

    const audio = this.getActiveAudio();
    const url = getSubsonicClient().stream(song.id);

    audio.src = url;
    audio.load();

    // Reset scrobble tracking
    this.scrobbled = false;

    try {
      await audio.play();
    } catch (err) {
      // AbortError is expected when a new play() call interrupts a pending one — ignore it
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('[PlaybackManager] Play error:', err);
      usePlayerStore.getState().setPlaying(false);
      return;
    }

    // Bail if another play() was called while we were awaiting
    if (thisPlayId !== this.playId) return;

    // Send "now playing" notification so the server shows this session
    getSubsonicClient().scrobble(song.id, false).catch(() => {});

    // Connect to Web Audio graph after first successful play.
    // On subsequent plays crossOrigin is already set so no re-fetch.
    if (!this.sourceA) {
      this.ensureAudioChain();
    }

    // Set active gain to full, inactive to zero — use setTargetAtTime to avoid clicks
    const activeGain = this.activePlayer === 'A' ? this.gainA : this.gainB;
    const inactiveGain = this.activePlayer === 'A' ? this.gainB : this.gainA;
    const now = this.audioContext?.currentTime ?? 0;
    if (activeGain) {
      activeGain.gain.cancelScheduledValues(now);
      activeGain.gain.setTargetAtTime(this.currentVolume, now, 0.02);
    }
    if (inactiveGain) {
      inactiveGain.gain.cancelScheduledValues(now);
      inactiveGain.gain.setTargetAtTime(0, now, 0.02);
    }

    this.applyReplayGain(song);
    this.updateMediaSession(song);
    this.startPositionTracking();
  }

  pause(): void {
    this.getActiveAudio().pause();
    this.stopPositionTracking();
  }

  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    try {
      await this.getActiveAudio().play();
    } catch (err) {
      console.error('[PlaybackManager] Resume error:', err);
    }
    this.startPositionTracking();
  }

  hasSource(): boolean {
    return !!this.getActiveAudio().src && this.getActiveAudio().src !== window.location.href;
  }

  seek(timeMs: number): void {
    const audio = this.getActiveAudio();
    audio.currentTime = timeMs / 1000;
    usePlayerStore.getState().setPosition(timeMs);
  }

  getPosition(): number {
    return this.getActiveAudio().currentTime;
  }

  getVolume(): number {
    return this.currentVolume;
  }

  toggleMute(): void {
    if (this.currentVolume > 0) {
      this.previousVolume = this.currentVolume;
      this.setVolume(0);
    } else {
      this.setVolume(this.previousVolume || 1);
    }
  }

  setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    const activeGain = this.activePlayer === 'A' ? this.gainA : this.gainB;
    if (activeGain && !this.crossfading) {
      const now = this.audioContext?.currentTime ?? 0;
      activeGain.gain.cancelScheduledValues(now);
      activeGain.gain.setTargetAtTime(this.currentVolume, now, 0.02);
    }
  }

  setPlaybackRate(rate: number): void {
    this.playerA.playbackRate = rate;
    this.playerB.playbackRate = rate;
  }

  updateEQ(bands: number[], enabled: boolean): void {
    if (this.eqFilters.length !== 10) return;

    for (let i = 0; i < 10; i++) {
      this.eqFilters[i].gain.value = enabled ? Math.max(-12, Math.min(12, bands[i] ?? 0)) : 0;
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  startSleepTimer(minutes: number): void {
    this.cancelSleepTimer();
    this.sleepRemainingMs = minutes * 60 * 1000;

    this.sleepTimerId = window.setInterval(() => {
      this.sleepRemainingMs -= 1000;

      if (this.sleepRemainingMs <= 0) {
        // Time's up, pause
        this.pause();
        usePlayerStore.getState().setPlaying(false);
        this.setVolume(this.currentVolume); // restore volume reference
        this.cancelSleepTimer();
        return;
      }

      // Fade during last N seconds
      if (this.sleepRemainingMs <= SLEEP_FADE_SECONDS * 1000) {
        const fraction = this.sleepRemainingMs / (SLEEP_FADE_SECONDS * 1000);
        const activeGain = this.activePlayer === 'A' ? this.gainA : this.gainB;
        if (activeGain) {
          activeGain.gain.value = this.currentVolume * fraction;
        }
      }
    }, 1000);
  }

  cancelSleepTimer(): void {
    if (this.sleepTimerId !== null) {
      clearInterval(this.sleepTimerId);
      this.sleepTimerId = null;
    }
    if (this.sleepFadeInterval !== null) {
      clearInterval(this.sleepFadeInterval);
      this.sleepFadeInterval = null;
    }
    this.sleepRemainingMs = 0;
    // Restore volume
    const activeGain = this.activePlayer === 'A' ? this.gainA : this.gainB;
    if (activeGain) {
      activeGain.gain.value = this.currentVolume;
    }
  }

  destroy(): void {
    this.stopPositionTracking();
    this.cancelCrossfade();
    this.cancelSleepTimer();

    if (this.unsubscribeEQ) {
      this.unsubscribeEQ();
      this.unsubscribeEQ = null;
    }

    this.playerA.pause();
    this.playerA.src = '';
    this.playerB.pause();
    this.playerB.src = '';

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.sourceA = null;
    this.sourceB = null;
    this.gainA = null;
    this.gainB = null;
    this.eqFilters = [];
    this.analyser = null;
  }

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  private getActiveAudio(): HTMLAudioElement {
    return this.activePlayer === 'A' ? this.playerA : this.playerB;
  }

  private getInactiveAudio(): HTMLAudioElement {
    return this.activePlayer === 'A' ? this.playerB : this.playerA;
  }

  private setupAudioChain(): void {
    const ctx = this.audioContext!;

    // createMediaElementSource can only be called once per HTMLAudioElement.
    // If sources already exist (e.g. React StrictMode re-mount), reuse them.
    if (!this.sourceA) {
      this.sourceA = ctx.createMediaElementSource(this.playerA);
    }
    if (!this.sourceB) {
      this.sourceB = ctx.createMediaElementSource(this.playerB);
    }

    // Per-player gain nodes (for crossfade volume control)
    this.gainA = ctx.createGain();
    this.gainB = ctx.createGain();
    this.gainA.gain.value = this.currentVolume;
    this.gainB.gain.value = 0;

    // Connect sources to their gain nodes
    this.sourceA.connect(this.gainA);
    this.sourceB.connect(this.gainB);

    // Create 10-band EQ (shared chain)
    this.eqFilters = EQ_FREQUENCIES.map((freq) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = EQ_Q;
      filter.gain.value = 0;
      return filter;
    });

    // Create analyser (shared, for visualizer)
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Chain: gainA/gainB → EQ[0] → EQ[1] → ... → EQ[9] → analyser → destination
    // Both gains feed into the first EQ filter
    this.gainA.connect(this.eqFilters[0]);
    this.gainB.connect(this.eqFilters[0]);

    // Chain EQ filters together
    for (let i = 0; i < this.eqFilters.length - 1; i++) {
      this.eqFilters[i].connect(this.eqFilters[i + 1]);
    }

    // Last EQ → analyser → destination
    this.eqFilters[this.eqFilters.length - 1].connect(this.analyser);
    this.analyser.connect(ctx.destination);
  }

  private startPositionTracking(): void {
    this.stopPositionTracking();

    let lastUpdate = 0;
    const tick = () => {
      const audio = this.getActiveAudio();
      if (!audio.paused && !audio.ended) {
        const now = performance.now();
        // Only push state updates at ~250ms intervals to avoid excessive re-renders
        if (now - lastUpdate >= POSITION_UPDATE_MS) {
          lastUpdate = now;
          const positionMs = Math.round(audio.currentTime * 1000);
          usePlayerStore.getState().setPosition(positionMs);
          this.checkScrobble();
          this.checkCrossfadeStart();
        }
      }
      this.positionInterval = window.requestAnimationFrame(tick);
    };
    this.positionInterval = window.requestAnimationFrame(tick);
  }

  private stopPositionTracking(): void {
    if (this.positionInterval !== null) {
      cancelAnimationFrame(this.positionInterval);
      this.positionInterval = null;
    }
  }

  private checkScrobble(): void {
    if (this.scrobbled) return;

    const state = usePlayerStore.getState();
    const song = state.currentSong;
    if (!song) return;

    const audio = this.getActiveAudio();
    const playedSeconds = audio.currentTime;
    const durationSeconds = audio.duration;

    if (isNaN(durationSeconds) || durationSeconds <= 0) return;

    const threshold = Math.min(SCROBBLE_MIN_SECONDS, durationSeconds * SCROBBLE_PERCENT);

    if (playedSeconds >= threshold) {
      this.scrobbled = true;

      // Submit scrobble (fire and forget)
      getSubsonicClient().scrobble(song.id, true).catch((err) => {
        console.error('[PlaybackManager] Scrobble error:', err);
      });
    }
  }

  private checkCrossfadeStart(): void {
    const state = usePlayerStore.getState();
    if (!state.crossfadeEnabled || this.crossfading) return;

    const audio = this.getActiveAudio();
    const remaining = audio.duration - audio.currentTime;

    if (isNaN(remaining)) return;

    if (remaining <= state.crossfadeDuration && remaining > 0) {
      // Determine next song
      const { queue, currentIndex, shuffleEnabled, shuffleOrder, repeatMode } = state;
      if (queue.length <= 1 && repeatMode !== 'one' && repeatMode !== 'all') return;

      let nextIndex: number;
      if (repeatMode === 'one') {
        // No crossfade for repeat-one, just let it end and restart
        return;
      }

      if (shuffleEnabled && shuffleOrder.length > 0) {
        const shufflePos = shuffleOrder.indexOf(currentIndex);
        const nextShufflePos = shufflePos + 1;
        if (nextShufflePos >= shuffleOrder.length) {
          if (repeatMode === 'all') {
            nextIndex = shuffleOrder[0];
          } else {
            return;
          }
        } else {
          nextIndex = shuffleOrder[nextShufflePos];
        }
      } else {
        nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeatMode === 'all') {
            nextIndex = 0;
          } else {
            return;
          }
        }
      }

      const nextSong = queue[nextIndex];
      if (nextSong) {
        this.startCrossfade(nextSong, nextIndex, state.crossfadeDuration);
      }
    }
  }

  private startCrossfade(nextSong: Song, nextIndex: number, duration: number): void {
    this.crossfading = true;

    const inactiveAudio = this.getInactiveAudio();
    const activeGain = this.activePlayer === 'A' ? this.gainA : this.gainB;
    const inactiveGain = this.activePlayer === 'A' ? this.gainB : this.gainA;

    if (!activeGain || !inactiveGain) return;

    // Load next track on inactive player
    const url = getSubsonicClient().stream(nextSong.id);
    inactiveAudio.src = url;
    inactiveAudio.crossOrigin = 'anonymous';

    inactiveAudio.play().catch((err) => {
      console.error('[PlaybackManager] Crossfade play error:', err);
      this.crossfading = false;
      return;
    });

    // Ramp gains using Web Audio API
    const now = this.audioContext!.currentTime;
    activeGain.gain.setValueAtTime(this.currentVolume, now);
    activeGain.gain.linearRampToValueAtTime(0, now + duration);
    inactiveGain.gain.setValueAtTime(0, now);
    inactiveGain.gain.linearRampToValueAtTime(this.currentVolume, now + duration);

    // After crossfade completes, swap players
    this.crossfadeTimer = window.setTimeout(() => {
      // Stop old player
      this.getActiveAudio().pause();
      this.getActiveAudio().src = '';

      // Swap active player
      this.activePlayer = this.activePlayer === 'A' ? 'B' : 'A';
      this.crossfading = false;
      this.crossfadeTimer = null;

      // Reset scrobble tracking for new song
      this.scrobbled = false;

      // Update store to reflect the new song (without triggering another play)
      const store = usePlayerStore.getState();
      store.setPosition(0);
      // Update current index/song directly via skipToIndex
      // We use internal set to avoid re-triggering play from the hook
      usePlayerStore.setState({
        currentIndex: nextIndex,
        currentSong: nextSong,
        isPlaying: true,
        positionMs: 0,
      });

      this.applyReplayGain(nextSong);
      this.updateMediaSession(nextSong);
    }, duration * 1000);
  }

  private cancelCrossfade(): void {
    if (this.crossfadeTimer !== null) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
    this.crossfading = false;

    // Stop inactive player
    const inactive = this.getInactiveAudio();
    inactive.pause();
    inactive.src = '';

    // Reset inactive gain
    const inactiveGain = this.activePlayer === 'A' ? this.gainB : this.gainA;
    if (inactiveGain) {
      inactiveGain.gain.cancelScheduledValues(0);
      inactiveGain.gain.value = 0;
    }

    // Reset active gain smoothly
    const activeGain = this.activePlayer === 'A' ? this.gainA : this.gainB;
    if (activeGain) {
      const now = this.audioContext?.currentTime ?? 0;
      activeGain.gain.cancelScheduledValues(now);
      activeGain.gain.setTargetAtTime(this.currentVolume, now, 0.02);
    }
  }

  private applyReplayGain(song: Song): void {
    if (!song.replayGain) return;

    const trackGain = song.replayGain.trackGain ?? song.replayGain.albumGain ?? 0;
    if (trackGain === 0) return;

    const gainMultiplier = Math.pow(10, trackGain / 20);
    const activeGain = this.activePlayer === 'A' ? this.gainA : this.gainB;
    if (activeGain) {
      const now = this.audioContext?.currentTime ?? 0;
      activeGain.gain.cancelScheduledValues(now);
      activeGain.gain.setTargetAtTime(this.currentVolume * gainMultiplier, now, 0.02);
    }
  }

  private updateMediaSession(song: Song): void {
    if (!('mediaSession' in navigator)) return;

    const client = getSubsonicClient();
    const artwork: MediaImage[] = [];
    if (song.coverArt) {
      artwork.push(
        { src: client.getCoverArt(song.coverArt, 96), sizes: '96x96', type: 'image/jpeg' },
        { src: client.getCoverArt(song.coverArt, 256), sizes: '256x256', type: 'image/jpeg' },
        { src: client.getCoverArt(song.coverArt, 512), sizes: '512x512', type: 'image/jpeg' },
      );
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist ?? 'Unknown Artist',
      album: song.album ?? 'Unknown Album',
      artwork,
    });

    navigator.mediaSession.setActionHandler('play', () => {
      this.resume();
      usePlayerStore.getState().setPlaying(true);
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      this.pause();
      usePlayerStore.getState().setPlaying(false);
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      usePlayerStore.getState().previous();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      usePlayerStore.getState().next();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) {
        this.seek(details.seekTime * 1000);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekOffset ?? 10;
      const audio = this.getActiveAudio();
      this.seek(Math.min((audio.currentTime + skipTime) * 1000, (audio.duration || 0) * 1000));
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skipTime = details.seekOffset ?? 10;
      const audio = this.getActiveAudio();
      this.seek(Math.max((audio.currentTime - skipTime) * 1000, 0));
    });
  }

  private handleTrackEnded(player: 'A' | 'B'): void {
    // Only handle if this is the active player and not crossfading
    if (player !== this.activePlayer || this.crossfading) return;

    this.stopPositionTracking();

    const state = usePlayerStore.getState();
    if (state.repeatMode === 'one') {
      // Restart current track
      const audio = this.getActiveAudio();
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.error('[PlaybackManager] Repeat-one replay error:', err);
      });
      this.scrobbled = false;
      this.startPositionTracking();
    } else {
      state.next();
    }
  }

  private handleError(player: 'A' | 'B'): void {
    if (player !== this.activePlayer) return;
    console.error(`[PlaybackManager] Audio error on player ${player}`);
    // Try to skip to next track
    usePlayerStore.getState().next();
  }

  private handleMetadata(player: 'A' | 'B'): void {
    if (player !== this.activePlayer || this.crossfading) return;
    const audio = this.getActiveAudio();
    if (!isNaN(audio.duration)) {
      usePlayerStore.getState().setDuration(Math.round(audio.duration * 1000));
    }
  }
}

// Singleton
let instance: PlaybackManager | null = null;

export function getPlaybackManager(): PlaybackManager {
  if (!instance) {
    instance = new PlaybackManager();
  }
  return instance;
}

export default PlaybackManager;
