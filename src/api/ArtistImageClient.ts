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
    return undefined;
  } catch {
    return undefined;
  }
}

async function setCache(key: string, url: string): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, { url, timestamp: Date.now() } as CachedImage, key);
  } catch { /* silently fail */ }
}

// Rate limiter for MusicBrainz (1 req/sec)
let lastMbRequest = 0;
async function mbRateLimit() {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastMbRequest));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastMbRequest = Date.now();
}

/**
 * Look up an artist image via MusicBrainz → Wikidata → Wikimedia Commons.
 * No CORS issues — MusicBrainz, Wikidata, and Wikimedia all support CORS.
 */
export async function getArtistImageUrl(artistName: string): Promise<string | null> {
  if (!artistName) return null;

  const cacheKey = `artist-img-v2:${artistName.toLowerCase()}`;
  const cached = await getCached(cacheKey);
  if (cached !== undefined && cached !== null) return cached;

  try {
    // Step 1: Search MusicBrainz for the artist MBID
    await mbRateLimit();
    const mbResponse = await fetch(
      `https://musicbrainz.org/ws/2/artist?query=artist:${encodeURIComponent(artistName)}&fmt=json&limit=1`,
      { headers: { 'User-Agent': 'Vibrdrome/1.0 (https://vibrdrome.io)' } },
    );
    if (!mbResponse.ok) return null;

    const mbData = await mbResponse.json();
    const mbid = mbData?.artists?.[0]?.id;
    if (!mbid) return null;

    // Step 2: Get Wikidata entity linked to this artist
    await mbRateLimit();
    const relResponse = await fetch(
      `https://musicbrainz.org/ws/2/artist/${mbid}?inc=url-rels&fmt=json`,
      { headers: { 'User-Agent': 'Vibrdrome/1.0 (https://vibrdrome.io)' } },
    );
    if (!relResponse.ok) return null;

    const relData = await relResponse.json();
    const relations = relData?.relations ?? [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wikidataRel = relations.find((r: any) =>
      r.type === 'wikidata' && r.url?.resource,
    );
    if (!wikidataRel) return null;

    const entityId = (wikidataRel.url.resource as string).split('/').pop();
    if (!entityId) return null;

    // Step 3: Get image filename from Wikidata (P18 = image property)
    const wdResponse = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&property=P18&format=json&origin=*`,
    );
    if (!wdResponse.ok) return null;

    const wdData = await wdResponse.json();
    const imageName = wdData?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!imageName) return null;

    // Step 4: Get the actual image URL from Wikimedia Commons API
    const filename = imageName.replace(/ /g, '_');
    const commonsResponse = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=200&format=json&origin=*`,
    );
    if (!commonsResponse.ok) return null;

    const commonsData = await commonsResponse.json();
    const pages = commonsData?.query?.pages;
    const page = pages ? Object.values(pages)[0] : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thumbUrl = (page as any)?.imageinfo?.[0]?.thumburl;

    if (thumbUrl) {
      // Force HTTPS to avoid mixed content warnings
      const secureUrl = thumbUrl.replace(/^http:\/\//, 'https://');
      await setCache(cacheKey, secureUrl);
      return secureUrl;
    }

    return null;
  } catch {
    return null;
  }
}
