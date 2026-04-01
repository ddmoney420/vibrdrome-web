import { openDB } from 'idb';
import type { LastFmArtistInfo } from '../api/LastFmClient';

const DB_NAME = 'vibrdrome_lastfm';
const STORE_NAME = 'artists';
const DB_VERSION = 1;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedEntry {
  data: LastFmArtistInfo;
  timestamp: number;
}

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function getCachedArtist(name: string): Promise<LastFmArtistInfo | null> {
  try {
    const db = await getDB();
    const key = name.toLowerCase();
    const entry = await db.get(STORE_NAME, key) as CachedEntry | undefined;

    if (entry && Date.now() - entry.timestamp < TTL_MS) {
      return entry.data;
    }

    // Expired — delete
    if (entry) await db.delete(STORE_NAME, key);
    return null;
  } catch {
    return null;
  }
}

export async function setCachedArtist(name: string, data: LastFmArtistInfo): Promise<void> {
  try {
    const db = await getDB();
    const key = name.toLowerCase();
    await db.put(STORE_NAME, { data, timestamp: Date.now() } as CachedEntry, key);
  } catch {
    /* silently fail */
  }
}
