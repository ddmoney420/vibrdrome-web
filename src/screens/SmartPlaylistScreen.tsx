import { useState, useEffect } from 'react';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { useSmartPlaylistStore } from '../stores/smartPlaylistStore';
import { getMostPlayed, getNotPlayedSince } from '../stores/playHistoryStore';
import type { Song } from '../types/subsonic';
import { Header, SongRow, LoadingSpinner } from '../components/common';

const ROTATION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

const FORGOTTEN_OPTIONS = [
  { value: 1, label: '1 month' },
  { value: 2, label: '2 months' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
];

const RECENT_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
];

type PlaylistType = 'heavy-rotation' | 'forgotten-gems' | 'recent-unplayed';

export default function SmartPlaylistScreen() {
  const playSongs = usePlayerStore((s) => s.playSongs);
  const {
    heavyRotationDays, forgottenGemsMonths, recentUnplayedDays,
    setHeavyRotationDays, setForgottenGemsMonths, setRecentUnplayedDays,
  } = useSmartPlaylistStore();

  const [activeType, setActiveType] = useState<PlaylistType>('heavy-rotation');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataInfo, setDataInfo] = useState('');

  const loadPlaylist = async (type: PlaylistType) => {
    setLoading(true);
    setSongs([]);
    setDataInfo('');

    try {
      const client = getSubsonicClient();

      if (type === 'heavy-rotation') {
        const daysMs = heavyRotationDays * 24 * 60 * 60 * 1000;
        const mostPlayed = await getMostPlayed(daysMs, 50);

        if (mostPlayed.length === 0) {
          setDataInfo('No play history yet. Keep listening and your heavy rotation will appear here!');
          setLoading(false);
          return;
        }

        const songPromises = mostPlayed.map((mp) =>
          client.getSong(mp.songId).catch(() => null)
        );
        const results = await Promise.all(songPromises);
        setSongs(results.filter((s): s is Song => s !== null));
        setDataInfo(`Based on ${mostPlayed.reduce((s, m) => s + m.count, 0)} plays in the last ${heavyRotationDays} days`);

      } else if (type === 'forgotten-gems') {
        const monthsMs = forgottenGemsMonths * 30 * 24 * 60 * 60 * 1000;
        const forgotten = await getNotPlayedSince(monthsMs);

        if (forgotten.size === 0) {
          setDataInfo('No forgotten gems yet. Songs you haven\'t played in a while will appear here.');
          setLoading(false);
          return;
        }

        const randomSongs = await client.getRandomSongs(200);
        const forgottenSongs = randomSongs.filter((s) => forgotten.has(s.id)).slice(0, 50);
        setSongs(forgottenSongs);
        setDataInfo(`${forgotten.size} songs not played in ${forgottenGemsMonths} month${forgottenGemsMonths > 1 ? 's' : ''}`);

      } else if (type === 'recent-unplayed') {
        const albums = await client.getAlbumList2('newest', 20);
        const allSongs: Song[] = [];
        for (const album of albums.slice(0, 10)) {
          const albumData = await client.getAlbum(album.id);
          if (albumData.song) allSongs.push(...albumData.song);
        }

        const recentMs = recentUnplayedDays * 24 * 60 * 60 * 1000;
        const mostPlayed = await getMostPlayed(recentMs * 10, 1000);
        const playedIds = new Set(mostPlayed.map((m) => m.songId));

        const unplayed = allSongs.filter((s) => !playedIds.has(s.id)).slice(0, 50);
        setSongs(unplayed);
        setDataInfo(`${unplayed.length} unplayed songs from recently added albums`);
      }
    } catch (err) {
      console.error('Smart playlist error:', err);
      setDataInfo('Failed to generate playlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load data when params change
    loadPlaylist(activeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, heavyRotationDays, forgottenGemsMonths, recentUnplayedDays]);

  const handlePlayAll = () => {
    if (songs.length > 0) playSongs(songs, 0);
  };

  const handleShuffle = () => {
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      playSongs(shuffled, 0);
    }
  };

  const playlists: { type: PlaylistType; label: string; icon: string }[] = [
    { type: 'heavy-rotation', label: 'Heavy Rotation', icon: '🔥' },
    { type: 'forgotten-gems', label: 'Forgotten Gems', icon: '💎' },
    { type: 'recent-unplayed', label: 'Recently Added, Unplayed', icon: '✨' },
  ];

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Smart Playlists" showBack />

      {/* Playlist type tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {playlists.map((pl) => (
          <button
            key={pl.type}
            onClick={() => setActiveType(pl.type)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeType === pl.type ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            <span>{pl.icon}</span>
            {pl.label}
          </button>
        ))}
      </div>

      {/* Config + actions */}
      <div className="flex flex-wrap items-center gap-3 px-4 pb-3">
        {activeType === 'heavy-rotation' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Time window:</span>
            <select
              value={heavyRotationDays}
              onChange={(e) => setHeavyRotationDays(Number(e.target.value))}
              className="rounded-lg border border-border bg-bg-secondary px-2 py-1 text-xs text-text-primary outline-none"
            >
              {ROTATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
        {activeType === 'forgotten-gems' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Not played in:</span>
            <select
              value={forgottenGemsMonths}
              onChange={(e) => setForgottenGemsMonths(Number(e.target.value))}
              className="rounded-lg border border-border bg-bg-secondary px-2 py-1 text-xs text-text-primary outline-none"
            >
              {FORGOTTEN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
        {activeType === 'recent-unplayed' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Added within:</span>
            <select
              value={recentUnplayedDays}
              onChange={(e) => setRecentUnplayedDays(Number(e.target.value))}
              className="rounded-lg border border-border bg-bg-secondary px-2 py-1 text-xs text-text-primary outline-none"
            >
              {RECENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {songs.length > 0 && (
          <>
            <button onClick={handlePlayAll} className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover">
              Play All
            </button>
            <button onClick={handleShuffle} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-bg-tertiary">
              Shuffle
            </button>
          </>
        )}
      </div>

      {dataInfo && <p className="px-4 pb-2 text-xs text-text-muted">{dataInfo}</p>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="mx-auto max-w-5xl px-1">
            {songs.map((song, i) => (
              <SongRow key={`${song.id}-${i}`} song={song} index={i} showAlbum onPlay={() => playSongs(songs, i)} />
            ))}
            {songs.length === 0 && !loading && !dataInfo && (
              <p className="py-8 text-center text-text-muted">No songs found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
