import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import type { Genre } from '../types/subsonic';
import { Header, LoadingSpinner } from '../components/common';

export default function GenresScreen() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getGenres();
        // Sort alphabetically by name
        data.sort((a, b) => a.value.localeCompare(b.value));
        setGenres(data);
      } catch (err) {
        console.error('Failed to load genres:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleGenreClick = (genre: Genre) => {
    const params = new URLSearchParams({
      type: 'byGenre',
      genre: genre.value,
      title: genre.value,
    });
    navigate(`/albums?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Genres" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Genres" showBack />

      <div className="flex-1 overflow-y-auto">
        {genres.map((genre) => (
          <button
            key={genre.value}
            onClick={() => handleGenreClick(genre)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-bg-tertiary"
          >
            <span className="truncate text-sm font-medium text-text-primary">
              {genre.value}
            </span>
            <span className="ml-3 shrink-0 text-xs text-text-muted">
              {genre.albumCount ?? 0} albums &middot; {genre.songCount ?? 0} songs
            </span>
          </button>
        ))}

        {genres.length === 0 && (
          <p className="py-8 text-center text-text-muted">No genres found.</p>
        )}
      </div>
    </div>
  );
}
