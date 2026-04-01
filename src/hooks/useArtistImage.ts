import { useState, useEffect } from 'react';
import { getSubsonicClient } from '../api/SubsonicClient';
import { getArtistImageUrl } from '../api/ArtistImageClient';
import { useUIStore } from '../stores/uiStore';

interface ArtistImageResult {
  imageUrl: string | null;
  artistId: string | null;
  coverArt: string | null;
}

const EMPTY: ArtistImageResult = { imageUrl: null, artistId: null, coverArt: null };

export function useArtistImage(artistName: string | undefined): ArtistImageResult {
  const fanartApiKey = useUIStore((s) => s.fanartApiKey);
  const [result, setResult] = useState<ArtistImageResult>(EMPTY);

  useEffect(() => {
    if (!artistName) return;

    let cancelled = false;

    const resolve = async () => {
      let foundArtistId: string | null = null;

      // Step 1: Try Subsonic server
      try {
        const searchResult = await getSubsonicClient().search3(artistName, 1, 0, 0);
        if (cancelled) return;
        const match = searchResult.artist?.[0];
        if (match) {
          foundArtistId = match.id;
          const coverArt = match.coverArt ?? null;
          if (coverArt) {
            const url = getSubsonicClient().getCoverArt(coverArt, 150);
            setResult({ imageUrl: url, artistId: match.id, coverArt });
            return;
          }
        }
      } catch { /* continue to fanart */ }

      // Step 2: Try fanart.tv
      if (fanartApiKey && !cancelled) {
        try {
          const fanartUrl = await getArtistImageUrl(artistName, fanartApiKey);
          if (cancelled) return;
          if (fanartUrl) {
            setResult({ imageUrl: fanartUrl, artistId: foundArtistId, coverArt: null });
            return;
          }
        } catch { /* continue */ }
      }

      // No image found
      if (!cancelled) {
        setResult({ imageUrl: null, artistId: foundArtistId, coverArt: null });
      }
    };

    resolve();

    return () => { cancelled = true; };
  }, [artistName, fanartApiKey]);

  return result;
}
