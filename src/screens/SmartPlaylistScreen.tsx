import { useState } from 'react';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import type { Song } from '../types/subsonic';
import { Header, LoadingSpinner } from '../components/common';

interface GeneratorCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<Song[]>;
}

export default function SmartPlaylistScreen() {
  const [loading, setLoading] = useState(false);
  const playSongs = usePlayerStore((s) => s.playSongs);

  const handleGenerate = async (action: () => Promise<Song[]>) => {
    setLoading(true);
    try {
      const songs = await action();
      if (songs.length > 0) {
        playSongs(songs, 0);
      }
    } catch (err) {
      console.error('Smart playlist generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const cards: GeneratorCard[] = [
    {
      id: 'random',
      title: 'Random Mix',
      description: 'A random selection of 50 songs',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
        </svg>
      ),
      action: async () => {
        const client = getSubsonicClient();
        return client.getRandomSongs(50);
      },
    },
    {
      id: 'artist-mix',
      title: 'Artist Mix',
      description: 'Top songs from an artist',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      action: async () => {
        const name = window.prompt('Enter artist name:');
        if (!name?.trim()) return [];
        const client = getSubsonicClient();
        return client.getTopSongs(name.trim(), 50);
      },
    },
    {
      id: 'genre-mix',
      title: 'Genre Mix',
      description: 'Random songs from a genre',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
          <path strokeLinecap="round" d="M9 19V6l12-3v13" />
          <circle cx="6" cy="19" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      ),
      action: async () => {
        const genre = window.prompt('Enter genre:');
        if (!genre?.trim()) return [];
        const client = getSubsonicClient();
        return client.getRandomSongs(50, genre.trim());
      },
    },
    {
      id: 'top-songs',
      title: 'Top Songs',
      description: 'Most popular by an artist',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      action: async () => {
        const artist = window.prompt('Enter artist name:');
        if (!artist?.trim()) return [];
        const client = getSubsonicClient();
        return client.getTopSongs(artist.trim(), 50);
      },
    },
    {
      id: 'recently-added',
      title: 'Recently Added',
      description: 'Newest additions to your library',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 6v6l4 2" />
        </svg>
      ),
      action: async () => {
        const client = getSubsonicClient();
        const albums = await client.getAlbumList2('newest', 10);
        const allSongs: Song[] = [];
        // getAlbumList2 returns stubs without songs; fetch each album's details
        for (const album of albums) {
          try {
            const full = await client.getAlbum(album.id);
            if (full.song) {
              allSongs.push(...full.song);
            }
          } catch {
            // skip albums that fail to load
          }
        }
        return allSongs;
      },
    },
    {
      id: 'starred',
      title: 'Starred Songs',
      description: 'All your favorite songs',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      action: async () => {
        const client = getSubsonicClient();
        const starred = await client.getStarred2();
        return starred.song ?? [];
      },
    },
  ];

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Smart Playlists" showBack />

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-primary/80">
          <LoadingSpinner />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleGenerate(card.action)}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-xl bg-bg-secondary p-5 text-center transition-colors hover:bg-bg-tertiary disabled:opacity-50"
            >
              <div className="text-accent">{card.icon}</div>
              <h3 className="text-sm font-semibold text-text-primary">{card.title}</h3>
              <p className="text-xs text-text-muted">{card.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
