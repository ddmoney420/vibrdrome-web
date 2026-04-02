import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { getPlaybackManager } from '../audio/PlaybackManager';
import { usePlayerStore } from '../stores/playerStore';
import type { InternetRadioStation } from '../types/subsonic';
import { Header, CoverArt, LoadingSpinner } from '../components/common';

export default function RadioScreen() {
  const navigate = useNavigate();
  const [stations, setStations] = useState<InternetRadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const radioMode = usePlayerStore((s) => s.radioMode);
  const playingId = radioMode?.stationId ?? null;

  const fetchStations = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getSubsonicClient();
      const data = await client.getInternetRadioStations();
      setStations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const client = getSubsonicClient();
      await client.deleteInternetRadioStation(id);
      setStations((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete station');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handlePlay = async (station: InternetRadioStation) => {
    // If already playing this station, stop it
    if (playingId === station.id) {
      getPlaybackManager().stopRadio();
      usePlayerStore.getState().stopRadio();
      return;
    }

    // Play via PlaybackManager + store
    usePlayerStore.getState().playRadio({
      stationId: station.id,
      stationName: station.name,
      streamUrl: station.streamUrl,
      coverArt: station.coverArt,
    });

    getPlaybackManager().playRadio(station.streamUrl);
  };


  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header
        title="Radio"
        showBack
        rightActions={
          <>
            <button
              onClick={() => navigate('/radio/search')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              aria-label="Search stations"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/radio/add')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              aria-label="Add station"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </>
        }
      />

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

        {!loading && !error && stations.length === 0 && (
          <div className="py-12 text-center text-text-muted">
            <p className="text-lg">No radio stations saved</p>
            <p className="mt-1 text-sm">Search for stations or add one manually</p>
          </div>
        )}

        {!loading && stations.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stations.map((station) => (
              <div
                key={station.id}
                className="flex items-center gap-3 rounded-lg bg-bg-secondary px-3 py-3 transition-colors hover:bg-bg-tertiary"
              >
                {station.coverArt ? (
                  <CoverArt coverArt={station.coverArt} size={40} className="shrink-0 rounded-lg" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-accent">
                      <path d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 12h.01" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {station.name}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {station.streamUrl}
                  </p>
                </div>

                <button
                  onClick={() => handlePlay(station)}
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                    playingId === station.id
                      ? 'bg-accent text-white animate-pulse'
                      : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                  aria-label={playingId === station.id ? `Stop ${station.name}` : `Play ${station.name}`}
                >
                  {playingId === station.id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {confirmDeleteId === station.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(station.id)}
                      disabled={deletingId === station.id}
                      className="rounded px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deletingId === station.id ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded px-2 py-1 text-xs text-text-muted transition-colors hover:bg-bg-tertiary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(station.id)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-tertiary hover:text-red-400"
                    aria-label={`Delete ${station.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
