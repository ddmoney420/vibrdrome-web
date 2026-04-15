/**
 * Orchestrates sequential downloads of audio tracks for offline playback.
 * Sends tracks to the service worker cache one at a time.
 */

import { getSubsonicClient } from '../api/SubsonicClient';
import { useDownloadStore } from '../stores/downloadStore';
import type { Song } from '../types/subsonic';

class DownloadManager {
  private processing = false;

  /**
   * Queue songs for download and start processing.
   */
  queueSongs(songs: Song[], albumId?: string): void {
    useDownloadStore.getState().addToQueue(songs, albumId);
    this.processQueue();
  }

  /**
   * Process the download queue sequentially.
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    useDownloadStore.getState().setDownloading(true);

    while (true) {
      const { queue } = useDownloadStore.getState();
      const next = queue.find((q) => q.status === 'pending');
      if (!next) break;

      await this.downloadTrack(next.song);
    }

    this.processing = false;
    useDownloadStore.getState().setDownloading(false);
  }

  private async downloadTrack(song: Song): Promise<void> {
    const store = useDownloadStore.getState();
    store.updateProgress(song.id, 0);

    try {
      const client = getSubsonicClient();
      const { useUIStore } = await import('../stores/uiStore');
      const quality = useUIStore.getState().streamQuality;
      const url = client.stream(song.id, quality || undefined);

      // Fetch the audio to measure size and cache it
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentLength = Number(response.headers.get('content-length') || 0);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No response body');
      }

      // Read the stream to track progress and collect chunks
      const chunks: BlobPart[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;

        if (contentLength > 0) {
          useDownloadStore.getState().updateProgress(song.id, received / contentLength);
        }
      }

      // Reconstruct the response and cache it via SW
      const blob = new Blob(chunks);
      const cacheResponse = new Response(blob, {
        headers: response.headers,
      });

      // Put directly in the cache
      const cache = await caches.open('vibrdrome-audio-v1');
      await cache.put(new Request(url), cacheResponse);

      useDownloadStore.getState().markDone(song.id, received);
    } catch (err) {
      console.error(`[DownloadManager] Failed to download ${song.title}:`, err);
      useDownloadStore.getState().markError(song.id);
    }
  }
}

// Singleton
let instance: DownloadManager | null = null;

export function getDownloadManager(): DownloadManager {
  if (!instance) {
    instance = new DownloadManager();
  }
  return instance;
}

export default DownloadManager;
