import { useState, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { getLastFmArtistInfo } from '../api/LastFmClient';
import { getCachedArtist, setCachedArtist } from '../utils/lastfmCache';
import type { LastFmArtistInfo } from '../api/LastFmClient';

export function useArtistInfo(artistName: string | undefined) {
  const apiKey = useUIStore((s) => s.lastfmApiKey);
  const [info, setInfo] = useState<LastFmArtistInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchedName, setFetchedName] = useState<string | null>(null);

  useEffect(() => {
    if (!artistName || !apiKey) {
      return;
    }

    if (fetchedName === artistName) return;

    let cancelled = false;

    const load = async () => {
      const cached = await getCachedArtist(artistName);
      if (cached && !cancelled) {
        setInfo(cached);
        setFetchedName(artistName);
        return;
      }

      if (!cancelled) setLoading(true);

      const result = await getLastFmArtistInfo(artistName, apiKey);
      if (cancelled) return;

      setInfo(result);
      setFetchedName(artistName);
      if (result) setCachedArtist(artistName, result);
      setLoading(false);
    };

    load();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistName, apiKey]);

  // Clear info when artist changes
  const displayInfo = fetchedName === artistName ? info : null;
  const isLoading = fetchedName !== artistName && !!artistName && !!apiKey || loading;

  return { info: displayInfo, loading: isLoading, hasApiKey: !!apiKey };
}
