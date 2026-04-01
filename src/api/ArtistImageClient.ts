import { openDB } from 'idb';

const DB_NAME = 'vibrdrome_artist_images';
const STORE_NAME = 'images';
const DB_VERSION = 1;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CachedImage {
  url: string | null;
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

async function getCached(key: string): Promise<string | null | undefined> {
  try {
    const db = await getDB();
    const entry = await db.get(STORE_NAME, key) as CachedImage | undefined;
    if (entry && Date.now() - entry.timestamp < TTL_MS) {
      return entry.url;
    }
    if (entry) await db.delete(STORE_NAME, key);
    return undefined; // cache miss
  } catch {
    return undefined;
  }
}

async function setCache(key: string, url: string | null): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, { url, timestamp: Date.now() } as CachedImage, key);
  } catch { /* silently fail */ }
}

/**
 * Look up an artist's MusicBrainz ID by name.
 * MusicBrainz requires a User-Agent header — we use the app name.
 */
// Simple rate limiter for MusicBrainz (1 req/sec)
let lastMbRequest = 0;
async function mbRateLimit() {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastMbRequest));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastMbRequest = Date.now();
}

async function getMusicBrainzId(artistName: string): Promise<string | null> {
  const cacheKey = `mbid:${artistName.toLowerCase()}`;
  const cached = await getCached(cacheKey);
  if (cached !== undefined) return cached;

  try {
    await mbRateLimit();

    const params = new URLSearchParams({
      query: `artist:${artistName}`,
      fmt: 'json',
      limit: '1',
    });

    const response = await fetch(`https://musicbrainz.org/ws/2/artist?${params}`, {
      headers: { 'User-Agent': 'Vibrdrome/1.0 (https://vibrdrome.io)' },
    });

    if (!response.ok) {
      if (response.status === 503) return null; // Rate limited — don't cache, retry later
      await setCache(cacheKey, null);
      return null;
    }

    const data = await response.json();
    const mbid = data?.artists?.[0]?.id ?? null;
    await setCache(cacheKey, mbid);
    return mbid;
  } catch {
    return null;
  }
}

/**
 * Fetch artist image from fanart.tv using MusicBrainz ID.
 */
async function getFanartImage(mbid: string, apiKey: string): Promise<string | null> {
  const cacheKey = `fanart:${mbid}`;
  const cached = await getCached(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(
      `https://webservice.fanart.tv/v3/music/${mbid}?api_key=${apiKey}`,
    );

    if (!response.ok) {
      await setCache(cacheKey, null);
      return null;
    }

    const data = await response.json();

    // Try artistthumb first, then artistbackground, then hdmusiclogo
    const thumb = data?.artistthumb?.[0]?.url
      ?? data?.artistbackground?.[0]?.url
      ?? null;

    await setCache(cacheKey, thumb);
    return thumb;
  } catch {
    await setCache(cacheKey, null);
    return null;
  }
}

/**
 * Get an artist image URL using the MusicBrainz → fanart.tv chain.
 * Returns null if no image found or API keys not configured.
 */
export async function getArtistImageUrl(
  artistName: string,
  fanartApiKey: string,
): Promise<string | null> {
  if (!fanartApiKey || !artistName) return null;

  // Full chain cache key
  const cacheKey = `artist-img:${artistName.toLowerCase()}`;
  const cached = await getCached(cacheKey);
  if (cached !== undefined) return cached;

  const mbid = await getMusicBrainzId(artistName);
  if (!mbid) {
    await setCache(cacheKey, null);
    return null;
  }

  const imageUrl = await getFanartImage(mbid, fanartApiKey);
  await setCache(cacheKey, imageUrl);
  return imageUrl;
}
