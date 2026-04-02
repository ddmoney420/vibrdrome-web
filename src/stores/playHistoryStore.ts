import { openDB } from 'idb';

const DB_NAME = 'vibrdrome_play_history';
const STORE_NAME = 'plays';
const DB_VERSION = 1;

export interface PlayRecord {
  songId: string;
  title: string;
  artist?: string;
  album?: string;
  timestamp: number;
}

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { autoIncrement: true });
        store.createIndex('songId', 'songId');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

/** Log a play event */
export async function logPlay(record: PlayRecord): Promise<void> {
  try {
    const db = await getDB();
    await db.add(STORE_NAME, record);
  } catch { /* silently fail */ }
}

/** Get play history, newest first */
export async function getPlayHistory(limit = 100): Promise<PlayRecord[]> {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME);
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch {
    return [];
  }
}

/** Get play count for a song */
export async function getSongPlayCount(songId: string): Promise<number> {
  try {
    const db = await getDB();
    const index = db.transaction(STORE_NAME).store.index('songId');
    const records = await index.getAll(songId);
    return records.length;
  } catch {
    return 0;
  }
}

/** Get most played songs in a time window */
export async function getMostPlayed(sinceMs: number, limit = 50): Promise<{ songId: string; count: number; title: string; artist?: string }[]> {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME) as PlayRecord[];
    const since = Date.now() - sinceMs;

    const counts = new Map<string, { count: number; title: string; artist?: string }>();
    for (const record of all) {
      if (record.timestamp >= since) {
        const existing = counts.get(record.songId);
        if (existing) {
          existing.count++;
        } else {
          counts.set(record.songId, { count: 1, title: record.title, artist: record.artist });
        }
      }
    }

    return Array.from(counts.entries())
      .map(([songId, data]) => ({ songId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/** Get songs not played since a given time */
export async function getNotPlayedSince(sinceMs: number): Promise<Set<string>> {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME) as PlayRecord[];
    const since = Date.now() - sinceMs;

    const lastPlayed = new Map<string, number>();
    for (const record of all) {
      const existing = lastPlayed.get(record.songId) ?? 0;
      if (record.timestamp > existing) lastPlayed.set(record.songId, record.timestamp);
    }

    const forgotten = new Set<string>();
    for (const [songId, last] of lastPlayed) {
      if (last < since) forgotten.add(songId);
    }

    return forgotten;
  } catch {
    return new Set();
  }
}
