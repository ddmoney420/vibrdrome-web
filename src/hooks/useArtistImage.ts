import { useState, useEffect } from 'react';
import { getSubsonicClient } from '../api/SubsonicClient';
import { getArtistImageUrl } from '../api/ArtistImageClient';
import { useUIStore } from '../stores/uiStore';

interface ArtistImageResult {
  imageUrl: string | null;
  artistId: string | null;
  coverArt: string | null;
}

/**
 * Resolves an artist image URL with fallback chain:
 * 1. Subsonic server (search for artist, use their coverArt)
 * 2. fanart.tv (via MusicBrainz MBID lookup)
 * 3. null (caller shows placeholder)
 */
export function useArtistImage(artistName: string | undefined): ArtistImageResult {
  const fanartApiKey = useUIStore((s) => s.fanartApiKey);
  const [result, setResult] = useState<ArtistImageResult>({ imageUrl: null, artistId: null, coverArt: null });

  useEffect(() => {
    if (!artistName) return;

    let cancelled = false;

    const resolve = async () => {
      // Step 1: Try Subsonic server
      try {
        const searchResult = await getSubsonicClient().search3(artistName, 1, 0, 0);
        if (cancelled) return;
        const match = searchResult.artist?.[0];
        if (match) {
          const coverArt = match.coverArt ?? null;
          if (coverArt) {
            const url = getSubsonicClient().getCoverArt(coverArt, 150);
            setResult({ imageUrl: url, artistId: match.id, coverArt });
            return;
          }
          // Artist found but no cover art — save ID, try fanart
          setResult((prev) => ({ ...prev, artistId: match.id }));
        }
      } catch { /* continue */ }

      // Step 2: Try fanart.tv
      if (fanartApiKey && !cancelled) {
        const fanartUrl = await getArtistImageUrl(artistName, fanartApiKey);
        if (fanartUrl && !cancelled) {
          setResult((prev) => ({ ...prev, imageUrl: fanartUrl }));
          return;
        }
      }
    };

    resolve();

    return () => { cancelled = true; };
  }, [artistName, fanartApiKey]);

  return result;
}
