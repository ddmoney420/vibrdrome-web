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
                <div className="flex flex-col items-center py-16">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mb-3 h-10 w-10 text-text-muted/40">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-text-muted">No favorite artists yet</p>
                  <p className="mt-1 text-xs text-text-muted/70">Star artists to see them here</p>
                </div>
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
                <div className="flex flex-col items-center py-16">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mb-3 h-10 w-10 text-text-muted/40">
                    <path fillRule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-text-muted">No favorite albums yet</p>
                  <p className="mt-1 text-xs text-text-muted/70">Star albums to see them here</p>
                </div>
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
                <div className="flex flex-col items-center py-16">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mb-3 h-10 w-10 text-text-muted/40">
                    <path fillRule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.706.122z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-text-muted">No favorite songs yet</p>
                  <p className="mt-1 text-xs text-text-muted/70">Star songs to see them here</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
