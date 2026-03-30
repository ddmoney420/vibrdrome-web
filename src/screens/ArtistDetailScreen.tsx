import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import type { Artist, Song } from '../types/subsonic';
import { Header, AlbumCard, LoadingSpinner } from '../components/common';

export default function ArtistDetailScreen() {
  const { artistId } = useParams<{ artistId: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId) return;
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getArtist(artistId);
        setArtist(data);
      } catch (err) {
        console.error('Failed to load artist:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [artistId]);

  const handleRadio = async () => {
    if (!artist) return;
    try {
      const client = getSubsonicClient();
      const [similar, top] = await Promise.all([
        client.getSimilarSongs2(artist.id, 30).catch(() => [] as Song[]),
        client.getTopSongs(artist.name, 20).catch(() => [] as Song[]),
      ]);
      // Interleave and deduplicate
      const seen = new Set<string>();
      const songs: Song[] = [];
      const maxLen = Math.max(similar.length, top.length);
      for (let i = 0; i < maxLen && songs.length < 50; i++) {
        if (i < similar.length && !seen.has(similar[i].id)) {
          seen.add(similar[i].id);
          songs.push(similar[i]);
        }
        if (i < top.length && !seen.has(top[i].id)) {
          seen.add(top[i].id);
          songs.push(top[i]);
        }
      }
      if (songs.length > 0) {
        usePlayerStore.getState().playSongs(songs);
      }
    } catch (err) {
      console.error('Failed to start artist radio:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Artist" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Artist" showBack />
        <p className="px-4 py-8 text-center text-text-muted">Artist not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header
        title={artist.name}
        showBack
        rightActions={
          <button
            onClick={handleRadio}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Artist radio"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
          {artist.album?.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>

        {(!artist.album || artist.album.length === 0) && (
          <p className="py-8 text-center text-text-muted">No albums found.</p>
        )}
      </div>
    </div>
  );
}
