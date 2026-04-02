import { openDB } from 'idb';

const DB_NAME = 'vibrdrome_waveforms';
const STORE_NAME = 'peaks';
const DB_VERSION = 1;
const BAR_COUNT = 200;

interface CachedWaveform {
  peaks: number[];
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

async function getCached(songId: string): Promise<number[] | null> {
  try {
    const db = await getDB();
    const entry = await db.get(STORE_NAME, songId) as CachedWaveform | undefined;
    if (entry) return entry.peaks;
    return null;
  } catch {
    return null;
  }
}

async function setCache(songId: string, peaks: number[]): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, { peaks, timestamp: Date.now() } as CachedWaveform, songId);
  } catch { /* silently fail */ }
}

/**
 * Extract waveform peaks from an audio URL.
 * Returns normalized peaks array (0-1) or null on failure.
 */
export async function extractWaveform(songId: string, audioUrl: string): Promise<number[] | null> {
  // Check cache first
  const cached = await getCached(songId);
  if (cached) return cached;

  try {
    // Fetch the audio data
    const response = await fetch(audioUrl);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();

    // Decode audio data
    const audioContext = new OfflineAudioContext(1, 1, 44100);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get raw PCM data from first channel
    const rawData = audioBuffer.getChannelData(0);
    const samplesPerBar = Math.floor(rawData.length / BAR_COUNT);

    const peaks: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      let sum = 0;
      const start = i * samplesPerBar;
      const end = Math.min(start + samplesPerBar, rawData.length);
      for (let j = start; j < end; j++) {
        sum += Math.abs(rawData[j]);
      }
      peaks.push(sum / (end - start));
    }

    // Normalize to 0-1
    const max = Math.max(...peaks, 0.001);
    const normalized = peaks.map((p) => p / max);

    // Cache it
    await setCache(songId, normalized);

    return normalized;
  } catch {
    return null;
  }
}
