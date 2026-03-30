import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import type { Song } from '../types/subsonic';
import { Header, LoadingSpinner } from '../components/common';

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlaylistEditorScreen() {
  const navigate = useNavigate();
  const { playlistId } = useParams<{ playlistId: string }>();
  const isEditMode = !!playlistId;

  const [name, setName] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing playlist
  useEffect(() => {
    if (!playlistId) return;
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const playlist = await client.getPlaylist(playlistId);
        setName(playlist.name);
        setSongs(playlist.entry ?? []);
      } catch (err) {
        console.error('Failed to load playlist:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playlistId]);

  // Search with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const client = getSubsonicClient();
        const result = await client.search3(value, 0, 0, 20);
        setSearchResults(result.song ?? []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const addSong = useCallback((song: Song) => {
    setSongs((prev) => [...prev, song]);
  }, []);

  const removeSong = useCallback((index: number) => {
    setSongs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const client = getSubsonicClient();
      const songIds = songs.map((s) => s.id);
      if (isEditMode && playlistId) {
        await client.updatePlaylist(playlistId, { name, songIdsToAdd: songIds });
      } else {
        await client.createPlaylist(name, songIds);
      }
      navigate(-1);
    } catch (err) {
      console.error('Failed to save playlist:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title={isEditMode ? 'Edit Playlist' : 'New Playlist'} showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header
        title={isEditMode ? 'Edit Playlist' : 'New Playlist'}
        showBack
        rightActions={
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-bg-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4">
        {/* Name input */}
        <div className="py-4">
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Playlist Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter playlist name"
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Add songs search */}
        <div className="pb-3">
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Add Songs
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search for songs..."
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Search results */}
        {(searchResults.length > 0 || searching) && (
          <div className="mb-4 rounded-lg border border-border bg-bg-secondary">
            {searching && searchResults.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-muted">Searching...</div>
            ) : (
              searchResults.map((song) => (
                <button
                  key={song.id}
                  onClick={() => addSong(song)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-bg-tertiary"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{song.title}</p>
                    <p className="truncate text-xs text-text-secondary">{song.artist}</p>
                  </div>
                  <span className="shrink-0 text-xs text-text-muted">{formatDuration(song.duration)}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-accent">
                    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              ))
            )}
          </div>
        )}

        {/* Current playlist songs */}
        <div className="pb-6">
          <h3 className="mb-2 text-sm font-medium text-text-secondary">
            Playlist Songs ({songs.length})
          </h3>
          {songs.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-muted">
              No songs added yet. Search above to add songs.
            </p>
          ) : (
            <div className="rounded-lg border border-border bg-bg-secondary">
              {songs.map((song, index) => (
                <div
                  key={`${song.id}-${index}`}
                  className="group flex items-center gap-3 px-3 py-2.5"
                >
                  <span className="w-6 shrink-0 text-right text-xs text-text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{song.title}</p>
                    <p className="truncate text-xs text-text-secondary">{song.artist}</p>
                  </div>
                  <span className="shrink-0 text-xs text-text-muted">{formatDuration(song.duration)}</span>
                  <button
                    onClick={() => removeSong(index)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg-tertiary hover:text-red-400"
                    aria-label="Remove song"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
