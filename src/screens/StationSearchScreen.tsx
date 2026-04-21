import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, LoadingSpinner } from '../components/common';

interface RadioBrowserStation {
  stationuuid: string;
  name: string;
  url: string;
  homepage: string;
  country: string;
  codec: string;
  bitrate: number;
}

export default function StationSearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RadioBrowserStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear results when query is empty
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setSearched(true);
      try {
        const encodedQuery = encodeURIComponent(query.trim());
        const response = await fetch(
          `https://de1.api.radio-browser.info/json/stations/byname/${encodedQuery}?limit=30&order=clickcount&reverse=true`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: RadioBrowserStation[] = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (station: RadioBrowserStation) => {
    navigate('/radio/add', {
      state: {
        name: station.name,
        streamUrl: station.url,
        homepageUrl: station.homepage,
      },
    });
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Search Stations" showBack />

      <div className="px-4 pb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search radio stations..."
          autoFocus
          className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-red-400">
            {error}
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <p className="py-12 text-center text-text-muted">No stations found</p>
        )}

        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((station) => (
              <button
                key={station.stationuuid}
                onClick={() => handleSelect(station)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {station.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                    {station.country && <span>{station.country}</span>}
                    {station.codec && (
                      <>
                        <span className="text-border">|</span>
                        <span>{station.codec}</span>
                      </>
                    )}
                    {station.bitrate > 0 && (
                      <>
                        <span className="text-border">|</span>
                        <span>{station.bitrate} kbps</span>
                      </>
                    )}
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-shrink-0 text-text-muted">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
