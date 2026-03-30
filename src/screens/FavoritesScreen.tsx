import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import type { Artist, Album, Song } from '../types/subsonic';
import { Header, CoverArt, AlbumCard, SongRow, LoadingSpinner } from '../components/common';

type Tab = 'artists' | 'albums' | 'songs';

export default function FavoritesScreen() {
  const navigate = useNavigate();
  const playSongs = usePlayerStore((s) => s.playSongs);
  const [activeTab, setActiveTab] = useState<Tab>('artists');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getStarred2();
        setArtists(data.artist ?? []);
        setAlbums(data.album ?? []);
        setSongs(data.song ?? []);
      } catch (err) {
        console.error('Failed to load favorites:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'artists', label: 'Artists' },
    { key: 'albums', label: 'Albums' },
    { key: 'songs', label: 'Songs' },
  ];

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Favorites" showBack />

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-accent text-accent'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Artists tab */}
          {activeTab === 'artists' && (
            <div>
              {artists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-bg-tertiary"
                >
                  <CoverArt
                    coverArt={artist.coverArt}
                    size={44}
                    className="rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {artist.name}
                    </p>
                    {artist.albumCount !== undefined && (
                      <p className="text-xs text-text-muted">
                        {artist.albumCount} {artist.albumCount === 1 ? 'album' : 'albums'}
                      </p>
                    )}
                  </div>
                </button>
              ))}
              {artists.length === 0 && (
                <p className="py-8 text-center text-text-muted">No favorite artists.</p>
              )}
            </div>
          )}

          {/* Albums tab */}
          {activeTab === 'albums' && (
            <div className="px-4 pt-4">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
              {albums.length === 0 && (
                <p className="py-8 text-center text-text-muted">No favorite albums.</p>
              )}
            </div>
          )}

          {/* Songs tab */}
          {activeTab === 'songs' && (
            <div className="px-1">
              {songs.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={i}
                  showAlbum
                  onPlay={() => playSongs(songs, i)}
                />
              ))}
              {songs.length === 0 && (
                <p className="py-8 text-center text-text-muted">No favorite songs.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
