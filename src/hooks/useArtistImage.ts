import { useState, useEffect, useRef } from 'react';
import { getSubsonicClient } from '../api/SubsonicClient';
import { getArtistImageUrl } from '../api/ArtistImageClient';

interface ArtistImageResult {
  imageUrl: string | null;
  artistId: string | null;
  coverArt: string | null;
}

const EMPTY: ArtistImageResult = { imageUrl: null, artistId: null, coverArt: null };

// Module-level cache to avoid re-fetching across component re-mounts
const resolvedCache = new Map<string, ArtistImageResult>();
const pendingResolves = new Map<string, Promise<ArtistImageResult>>();

async function resolveArtistImage(artistName: string): Promise<ArtistImageResult> {
  const cacheKey = `img:${artistName.toLowerCase()}`;

  const cached = resolvedCache.get(cacheKey);
  // Only use cache if we found an image, or if we searched with the same key config
  if (cached && cached.imageUrl) return cached;

  // Deduplicate concurrent requests for the same artist
  const pending = pendingResolves.get(cacheKey);
  if (pending) return pending;

  const promise = (async (): Promise<ArtistImageResult> => {
    let foundArtistId: string | null = null;

    // Step 1: Try Subsonic server
    try {
      const searchResult = await getSubsonicClient().search3(artistName, 5, 0, 0);
      const artists = searchResult.artist ?? [];
      const match = artists.find((a) => a.name.toLowerCase() === artistName.toLowerCase()) ?? artists[0];
      if (match) {
        foundArtistId = match.id;
        const coverArt = match.coverArt ?? null;
        if (coverArt) {
          const url = getSubsonicClient().getCoverArt(coverArt, 150);
          const result = { imageUrl: url, artistId: match.id, coverArt };
          resolvedCache.set(cacheKey, result);
          return result;
        }
      }
    } catch { /* continue */ }

    // Step 2: Try MusicBrainz → Wikidata → Wikimedia Commons
    {
      try {
        const fanartUrl = await getArtistImageUrl(artistName);
        if (fanartUrl) {
          const result = { imageUrl: fanartUrl, artistId: foundArtistId, coverArt: null };
          resolvedCache.set(cacheKey, result);
          return result;
        }
      } catch { /* continue */ }
    }

    const result = { imageUrl: null, artistId: foundArtistId, coverArt: null };
    resolvedCache.set(cacheKey, result);
    return result;
  })();

  pendingResolves.set(cacheKey, promise);
  promise.finally(() => pendingResolves.delete(cacheKey));

  return promise;
}

export function useArtistImage(artistName: string | undefined): ArtistImageResult {
  const [result, setResult] = useState<ArtistImageResult>(EMPTY);
  const nameRef = useRef(artistName);

  useEffect(() => {
    nameRef.current = artistName;
    if (!artistName) return;

    resolveArtistImage(artistName).then((res) => {
      if (nameRef.current === artistName) {
        setResult(res);
      }
    });
  }, [artistName]);

  return result;
}
