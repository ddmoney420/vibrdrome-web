/**
 * Server-side queue sync via OpenSubsonic indexBasedQueue extension.
 * Debounced saves, periodic position sync, and startup queue restoration.
 *
 * All imports are dynamic to avoid EnvironmentTeardownError in tests —
 * this module is loaded lazily from playerStore's persistQueue().
 */

const DEBOUNCE_MS = 1500;
let debounceTimer: number | null = null;

/**
 * Schedule a debounced save of the current queue to the server.
 * Called from persistQueue() in playerStore — coalesces rapid changes.
 */
export function scheduleQueueSync(): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null;
    saveQueueToServer();
  }, DEBOUNCE_MS);
}

/**
 * Save current playback position to the server immediately.
 * Called on pause, every 30s during playback, and on beforeunload.
 */
export function syncPosition(): void {
  saveQueueToServer();
}

/**
 * Load queue from server on startup. Only loads if sync is enabled
 * and the local queue is empty (client wins on conflict).
 */
export async function loadServerQueue(): Promise<void> {
  const { useUIStore } = await import('../stores/uiStore');
  const { usePlayerStore } = await import('../stores/playerStore');
  const { getSubsonicClient } = await import('../api/SubsonicClient');

  if (!useUIStore.getState().queueSyncEnabled) return;

  const { queue } = usePlayerStore.getState();
  if (queue.length > 0) return; // client wins

  try {
    const client = getSubsonicClient();
    if (!client.isConfigured()) return;

    const indexBased = await client.supportsIndexBasedQueue();

    if (indexBased) {
      const pq = await client.getPlayQueueByIndex();
      if (pq.entry && pq.entry.length > 0) {
        const index = pq.currentIndex ?? 0;
        usePlayerStore.getState().playSongs(pq.entry, index);
        usePlayerStore.setState({ isPlaying: false });
        if (pq.position) {
          usePlayerStore.getState().setPosition(pq.position);
        }
      }
    } else {
      const pq = await client.getPlayQueue();
      if (pq.entry && pq.entry.length > 0) {
        const index = pq.current
          ? pq.entry.findIndex((s) => s.id === pq.current)
          : 0;
        usePlayerStore.getState().playSongs(pq.entry, Math.max(0, index));
        usePlayerStore.setState({ isPlaying: false });
        if (pq.position) {
          usePlayerStore.getState().setPosition(pq.position);
        }
      }
    }
  } catch (err) {
    console.error('[queueSync] Failed to load server queue:', err);
  }
}

/**
 * Cancel any pending debounced save. Called on logout.
 */
export function cancelPendingSync(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

async function saveQueueToServer(): Promise<void> {
  const { useUIStore } = await import('../stores/uiStore');
  const { usePlayerStore } = await import('../stores/playerStore');
  const { getSubsonicClient } = await import('../api/SubsonicClient');

  if (!useUIStore.getState().queueSyncEnabled) return;

  const { queue, currentIndex, positionMs, radioMode } = usePlayerStore.getState();
  if (radioMode) return;

  try {
    const client = getSubsonicClient();
    if (!client.isConfigured()) return;

    const ids = queue.map((s) => s.id);
    const indexBased = await client.supportsIndexBasedQueue();

    if (ids.length === 0) {
      if (indexBased) {
        await client.savePlayQueueByIndex([], 0, 0);
      } else {
        await client.savePlayQueue([], undefined, 0);
      }
      return;
    }

    if (indexBased) {
      await client.savePlayQueueByIndex(ids, currentIndex, positionMs);
    } else {
      const currentId = queue[currentIndex]?.id;
      await client.savePlayQueue(ids, currentId, positionMs);
    }
  } catch (err) {
    console.error('[queueSync] Failed to save queue:', err);
  }
}
