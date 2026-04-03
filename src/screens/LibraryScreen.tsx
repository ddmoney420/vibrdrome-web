import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useMusicFolderStore } from '../stores/musicFolderStore';
import type { LibraryItem, CustomCarousel } from '../stores/libraryStore';
import AlbumCard from '../components/common/AlbumCard';
import Header from '../components/common/Header';
import FirstRunTooltip from '../components/common/FirstRunTooltip';
import type { Album, Playlist } from '../types/subsonic';
import CoverArt from '../components/common/CoverArt';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CAROUSEL_SIZE = 20;

interface CachedAlbums {
  data: Album[];
  fetchedAt: number;
}

const albumCache: Record<string, CachedAlbums> = {};

function isCacheValid(key: string): boolean {
  const cached = albumCache[key];
  return !!cached && Date.now() - cached.fetchedAt < CACHE_DURATION;
}

function useCachedAlbums(type: string, folderId: string | null, size = CAROUSEL_SIZE) {
  const cacheKey = `${type}:${folderId ?? 'all'}`;
  const [albums, setAlbums] = useState<Album[]>(() => albumCache[cacheKey]?.data ?? []);
  const [loading, setLoading] = useState(() => !isCacheValid(cacheKey));
  const [fetchKey, setFetchKey] = useState(cacheKey);

  // Reset loading state when cache key changes
  if (fetchKey !== cacheKey) {
    setFetchKey(cacheKey);
    if (isCacheValid(cacheKey)) {
      setAlbums(albumCache[cacheKey].data);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  useEffect(() => {
    if (isCacheValid(cacheKey)) return;

    let cancelled = false;

    const client = getSubsonicClient();
    let promise: Promise<Album[]>;

    if (type === 'starred') {
      promise = client.getStarred2().then((s) => s.album ?? []);
    } else if (type === 'thisYear') {
      const year = new Date().getFullYear();
      promise = client.getAlbumList2('byYear' as 'newest', size, undefined, undefined, year, year, folderId ?? undefined);
    } else {
      promise = client.getAlbumList2(type as 'newest' | 'frequent' | 'random' | 'recent', size, undefined, undefined, undefined, undefined, folderId ?? undefined);
    }

    promise
      .then((data) => {
        if (cancelled) return;
        albumCache[cacheKey] = { data, fetchedAt: Date.now() };
        setAlbums(data);
      })
      .catch(() => { /* silently fail */ })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, size, cacheKey, folderId]);

  return { albums, loading };
}

// SVG icon helpers
const IconMusic = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M17.721 1.599a.75.75 0 01.279.584v11.29a2.25 2.25 0 01-1.774 2.198l-2.041.442a2.216 2.216 0 01-.938-4.333l2.662-.576A.75.75 0 0016.5 10.5V5.372l-8 1.733v8.368a2.25 2.25 0 01-1.774 2.198l-2.042.442a2.216 2.216 0 01-.938-4.333l2.663-.576A.75.75 0 007 12.5V3.5a.75.75 0 01.592-.733l9-1.95a.75.75 0 01.129-.018z" />
  </svg>
);
const IconStar = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
  </svg>
);
const IconDisc = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);
const IconFolder = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
  </svg>
);
const IconList = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1h.01a1 1 0 010 2h-.01a1 1 0 01-1-1zM2.99 9a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V10a1 1 0 00-1-1h-.01zM1.99 15.25a1 1 0 011-1h.01a1 1 0 010 2h-.01a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);
const IconRadio = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L14 10 4.555 5.168z" />
  </svg>
);
const IconUsers = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A18.59 18.59 0 017 18a18.59 18.59 0 01-5.385-1.572zM14.5 16.5a18.595 18.595 0 01-2.258-.155 8.003 8.003 0 00-.723-3.256 3.973 3.973 0 012.5-.894c2.025 0 3.77 1.207 4.481 2.933a1.224 1.224 0 01-.57 1.174C16.957 16.753 15.77 17 14.5 17v-.5z" />
  </svg>
);
const IconDownload = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
  </svg>
);
const IconClock = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
  </svg>
);
const IconShuffle = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.397a.75.75 0 00-.75.75v3.834a.75.75 0 001.5 0v-2.009l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39.75.75 0 01-.41-.013zm-10.624-2.85a5.5 5.5 0 019.201-2.465l.312.31H11.77a.75.75 0 000 1.5h3.835a.75.75 0 00.75-.75V3.335a.75.75 0 00-1.5 0v2.009l-.312-.31A7 7 0 002.83 8.171a.75.75 0 001.449.39.75.75 0 01.41.013z" clipRule="evenodd" />
  </svg>
);
const IconTag = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);
const IconSparkles = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.052.683a1 1 0 000 1.898l2.052.683a1 1 0 01.633.633l.683 2.052a1 1 0 001.898 0l.683-2.052a1 1 0 01.633-.633l2.052-.683a1 1 0 000-1.898l-2.052-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
  </svg>
);

const PILL_ICONS: Record<string, React.ReactNode> = {
  genres: IconTag,
  radio: IconRadio,
  artists: IconUsers,
  favorites: IconStar,
  albums: IconDisc,
  folders: IconFolder,
  songs: IconMusic,
  downloads: IconDownload,
  playlists: IconList,
  recentlyAdded: IconClock,
  generations: IconSparkles,
  recentlyPlayed: IconClock,
  randomMix: IconShuffle,
  randomAlbum: IconShuffle,
};

const SearchIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
  </svg>
);
const SettingsIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);
const CustomizeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path d="M10 3.75a2 2 0 10-4 0 2 2 0 004 0zM17.25 4.5a.75.75 0 000-1.5h-5.5a.75.75 0 000 1.5h5.5zM5 3.75a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM4.25 17a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zM17.25 17a.75.75 0 000-1.5h-5.5a.75.75 0 000 1.5h5.5zM9 10a.75.75 0 01-.75.75h-5.5a.75.75 0 010-1.5h5.5A.75.75 0 019 10zM17.25 10.75a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zM14 10a2 2 0 10-4 0 2 2 0 004 0zM10 16.25a2 2 0 10-4 0 2 2 0 004 0z" />
  </svg>
);

const CAROUSEL_LABELS: Record<string, string> = {
  newest: 'Recently Added',
  frequent: 'Most Played',
  random: 'Random Picks',
  starred: 'Starred Albums',
  thisYear: `Released in ${new Date().getFullYear()}`,
  recent: 'Recently Played',
  playlists: 'Playlists',
};

const CAROUSEL_SEE_ALL: Record<string, string> = {
  newest: '/albums?type=newest',
  frequent: '/albums?type=frequent',
  random: '/albums?type=random',
  starred: '/favorites',
  thisYear: `/albums?type=byYear&fromYear=${new Date().getFullYear()}&toYear=${new Date().getFullYear()}`,
  recent: '/albums?type=recent',
  playlists: '/playlists',
};

export default function LibraryScreen() {
  const navigate = useNavigate();
  const playSongs = usePlayerStore((s) => s.playSongs);
  const { pills, carousels, customCarousels, pillsPosition } = useLibraryStore();
  const activeFolderId = useMusicFolderStore((s) => s.activeFolderId);
  const [showCustomize, setShowCustomize] = useState(false);

  const handleRandomMix = async () => {
    try {
      const songs = await getSubsonicClient().getRandomSongs(50, undefined, activeFolderId ?? undefined);
      if (songs.length > 0) {
        playSongs(songs, 0);
      }
    } catch { /* silently fail */ }
  };

  const handleRandomAlbum = async () => {
    try {
      const albums = await getSubsonicClient().getAlbumList2('random', 1, undefined, undefined, undefined, undefined, activeFolderId ?? undefined);
      if (albums.length > 0) {
        navigate(`/album/${albums[0].id}`);
      }
    } catch { /* silently fail */ }
  };

  const PILL_ACTIONS: Record<string, () => void> = {
    genres: () => navigate('/genres'),
    radio: () => navigate('/radio'),
    artists: () => navigate('/artists'),
    favorites: () => navigate('/favorites'),
    albums: () => navigate('/albums'),
    folders: () => navigate('/folders'),
    songs: () => navigate('/songs'),
    downloads: () => navigate('/downloads'),
    playlists: () => navigate('/playlists'),
    recentlyAdded: () => navigate('/albums?type=newest'),
    generations: () => navigate('/generations'),
    recentlyPlayed: () => navigate('/albums?type=recent'),
    randomMix: handleRandomMix,
    randomAlbum: handleRandomAlbum,
  };

  const visiblePills = pills.filter((p) => p.visible);
  const visibleCarousels = carousels.filter((c) => c.visible);

  const rightActions = (
    <>
      <FirstRunTooltip id="customize-library" message="Customize your library layout, create custom carousels, and reorder shortcuts" position="bottom">
        <button
          onClick={() => setShowCustomize(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Customize"
        >
          {CustomizeIcon}
        </button>
      </FirstRunTooltip>
      <button
        onClick={() => navigate('/search')}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        aria-label="Search"
      >
        {SearchIcon}
      </button>
      <button
        onClick={() => navigate('/settings')}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        aria-label="Settings"
      >
        {SettingsIcon}
      </button>
    </>
  );

  return (
    <div className="pb-20 md:pb-4">
      <Header title="Library" rightActions={rightActions} />

      {/* Pills (above position) */}
      {pillsPosition === 'above' && <PillsGrid pills={visiblePills} actions={PILL_ACTIONS} icons={PILL_ICONS} />}

      {/* Default Carousels */}
      {visibleCarousels.map((carousel) => (
        carousel.id === 'playlists' ? (
          <PlaylistCarousel key="playlists" onSeeAll={() => navigate('/playlists')} />
        ) : (
          <AlbumCarousel
            key={`${carousel.id}:${activeFolderId ?? 'all'}`}
            type={carousel.id}
            folderId={activeFolderId}
            title={CAROUSEL_LABELS[carousel.id] ?? carousel.label}
            onSeeAll={() => navigate(CAROUSEL_SEE_ALL[carousel.id] ?? '/albums')}
          />
        )
      ))}

      {/* Custom Carousels */}
      {customCarousels.filter((c) => c.visible).map((cc) => (
        <CustomAlbumCarousel
          key={`custom:${cc.id}:${activeFolderId ?? 'all'}`}
          config={cc}
          folderId={activeFolderId}
          onSeeAll={() => {
            if (cc.type === 'byYear' || cc.type === 'decade') {
              navigate(`/albums?type=byYear&fromYear=${cc.fromYear}&toYear=${cc.toYear}`);
            } else if (cc.type === 'byGenre') {
              navigate(`/albums?type=byGenre&genre=${encodeURIComponent(cc.genres?.[0] ?? cc.genre ?? '')}`);
            } else if (cc.type === 'playlist' && cc.playlistId) {
              navigate(`/playlist/${cc.playlistId}`);
            } else {
              navigate(`/albums?type=${cc.type}`);
            }
          }}
        />
      ))}

      {/* Pills (below position) */}
      {pillsPosition === 'below' && <PillsGrid pills={visiblePills} actions={PILL_ACTIONS} icons={PILL_ICONS} />}

      {showCustomize && (
        <CustomizeModal onClose={() => setShowCustomize(false)} />
      )}
    </div>
  );
}

function PlaylistCarousel({ onSeeAll }: { onSeeAll: () => void }) {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSubsonicClient().getPlaylists()
      .then((data) => { if (!cancelled) setPlaylists(data); })
      .catch(() => { /* silently fail */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-4 pb-3">
        <h2 className="text-lg font-bold text-text-primary">Playlists</h2>
        <button onClick={onSeeAll} className="text-sm font-medium text-accent transition-colors hover:text-accent-hover">
          See All
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bg-tertiary border-t-accent" />
        </div>
      ) : playlists.length === 0 ? (
        <p className="px-4 text-sm text-text-muted">No playlists</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-3 pb-2 scrollbar-hide md:px-4">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => navigate(`/playlist/${pl.id}`)}
              className="group flex snap-start shrink-0 flex-col gap-2 text-left"
              style={{ width: 120 }}
            >
              <CoverArt coverArt={pl.coverArt} size={120} className="transition-transform duration-200 group-hover:scale-[1.03]" />
              <div className="min-w-0 px-0.5">
                <p className="truncate text-sm font-medium text-text-primary">{pl.name}</p>
                <p className="truncate text-xs text-text-secondary">{pl.songCount ?? 0} songs</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function PillsGrid({ pills, actions, icons }: { pills: LibraryItem[]; actions: Record<string, () => void>; icons: Record<string, React.ReactNode> }) {
  if (pills.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-1.5 px-3 pb-4 md:gap-2 md:px-4 md:pb-6">
      {pills.map((pill) => (
        <button
          key={pill.id}
          onClick={actions[pill.id]}
          className="flex items-center gap-2 rounded-full bg-bg-secondary px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-tertiary md:gap-2.5 md:px-4 md:py-2.5"
        >
          <span className="text-text-secondary">{icons[pill.id]}</span>
          <span className="truncate">{pill.label}</span>
        </button>
      ))}
    </div>
  );
}

function AlbumCarousel({
  type,
  title,
  folderId,
  onSeeAll,
}: {
  type: string;
  title: string;
  folderId: string | null;
  onSeeAll: () => void;
}) {
  const { albums, loading } = useCachedAlbums(type, folderId, CAROUSEL_SIZE);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-4 pb-3">
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        <button
          onClick={onSeeAll}
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          See All
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bg-tertiary border-t-accent" />
        </div>
      ) : albums.length === 0 ? (
        <p className="px-4 text-sm text-text-muted">No albums found</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-3 pb-2 scrollbar-hide md:px-4">
          {albums.map((album, i) => (
            <div key={`${album.id}-${i}`} className="snap-start shrink-0">
              <AlbumCard album={album} size="small" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CustomAlbumCarousel({
  config,
  folderId,
  onSeeAll,
}: {
  config: CustomCarousel;
  folderId: string | null;
  onSeeAll: () => void;
}) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const client = getSubsonicClient();
    let promise: Promise<Album[]>;

    if (config.type === 'byYear' || config.type === 'decade') {
      promise = client.getAlbumList2('byYear' as 'newest', CAROUSEL_SIZE, undefined, undefined, config.fromYear, config.toYear, folderId ?? undefined);
    } else if (config.type === 'byGenre') {
      const genreList = config.genres ?? (config.genre ? [config.genre] : []);
      if (genreList.length > 1) {
        // Multi-genre: fetch each and merge/dedupe
        promise = Promise.all(
          genreList.map((g) => client.getAlbumList2('byGenre' as 'newest', CAROUSEL_SIZE, undefined, g, undefined, undefined, folderId ?? undefined))
        ).then((results) => {
          const seen = new Set<string>();
          const merged: Album[] = [];
          for (const albums of results) {
            for (const a of albums) {
              if (!seen.has(a.id)) { seen.add(a.id); merged.push(a); }
            }
          }
          return merged.slice(0, CAROUSEL_SIZE);
        });
      } else {
        promise = client.getAlbumList2('byGenre' as 'newest', CAROUSEL_SIZE, undefined, genreList[0], undefined, undefined, folderId ?? undefined);
      }
    } else if (config.type === 'playlist' && config.playlistId) {
      promise = client.getPlaylist(config.playlistId).then((pl) =>
        (pl.entry ?? []).slice(0, CAROUSEL_SIZE).map((song) => ({
          id: song.albumId ?? song.id,
          name: song.album ?? song.title,
          artist: song.artist,
          coverArt: song.coverArt,
        } as Album))
      );
    } else {
      promise = client.getAlbumList2('highest' as 'newest', CAROUSEL_SIZE, undefined, undefined, undefined, undefined, folderId ?? undefined);
    }

    promise
      .then((data) => { if (!cancelled) setAlbums(data); })
      .catch(() => { /* silently fail */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [config, folderId]);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-4 pb-3">
        <h2 className="text-lg font-bold text-text-primary">{config.label}</h2>
        <button onClick={onSeeAll} className="text-sm font-medium text-accent transition-colors hover:text-accent-hover">
          See All
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bg-tertiary border-t-accent" />
        </div>
      ) : albums.length === 0 ? (
        <p className="px-4 text-sm text-text-muted">No albums found</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-3 pb-2 scrollbar-hide md:px-4">
          {albums.map((album, i) => (
            <div key={`${album.id}-${i}`} className="snap-start shrink-0">
              <AlbumCard album={album} size="small" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// --- Customize Modal ---

function CustomizeModal({ onClose }: { onClose: () => void }) {
  const { pills, carousels, customCarousels, pillsPosition, togglePill, toggleCarousel, movePill, moveCarousel, setPillsPosition, addCustomCarousel, updateCustomCarousel, removeCustomCarousel, toggleCustomCarousel, moveCustomCarousel } = useLibraryStore();
  const [tab, setTab] = useState<'pills' | 'carousels' | 'custom'>('pills');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-bg-secondary max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-text-primary">Customize Library</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-tertiary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('pills')}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              tab === 'pills' ? 'text-accent border-b-2 border-accent' : 'text-text-muted'
            }`}
          >
            Shortcuts
          </button>
          <button
            onClick={() => setTab('carousels')}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              tab === 'carousels' ? 'text-accent border-b-2 border-accent' : 'text-text-muted'
            }`}
          >
            Carousels
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              tab === 'custom' ? 'text-accent border-b-2 border-accent' : 'text-text-muted'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 text-xs text-text-muted">
            Toggle visibility and drag to reorder.
          </p>
          {tab === 'pills' && (
            <>
              <div className="mb-3 flex items-center justify-between rounded-lg bg-bg-tertiary/50 px-3 py-2">
                <span className="text-xs text-text-secondary">Position</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPillsPosition('above')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${pillsPosition === 'above' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    Above Carousels
                  </button>
                  <button
                    onClick={() => setPillsPosition('below')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${pillsPosition === 'below' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    Below Carousels
                  </button>
                </div>
              </div>
              <ReorderList items={pills} onToggle={togglePill} onMove={movePill} />
            </>
          )}
          {tab === 'carousels' && (
            <ReorderList items={carousels} onToggle={toggleCarousel} onMove={moveCarousel} />
          )}
          {tab === 'custom' && (
            <CustomCarouselManager
              carousels={customCarousels}
              onAdd={addCustomCarousel}
              onUpdate={updateCustomCarousel}
              onRemove={removeCustomCarousel}
              onToggle={toggleCustomCarousel}
              onMove={moveCustomCarousel}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReorderList({
  items,
  onToggle,
  onMove,
}: {
  items: LibraryItem[];
  onToggle: (id: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      onMove(dragIndex, index);
      setDragIndex(index);
    }
  }, [dragIndex, onMove]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
            dragIndex === index ? 'bg-accent/10' : 'bg-bg-tertiary/50'
          }`}
        >
          {/* Drag handle */}
          <span className="cursor-grab text-text-muted active:cursor-grabbing">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </span>

          {/* Label */}
          <span className={`flex-1 text-sm ${item.visible ? 'text-text-primary' : 'text-text-muted'}`}>
            {item.label}
          </span>

          {/* Move buttons for touch */}
          <button
            onClick={() => index > 0 && onMove(index, index - 1)}
            className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-30"
            disabled={index === 0}
            aria-label="Move up"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => index < items.length - 1 && onMove(index, index + 1)}
            className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-30"
            disabled={index === items.length - 1}
            aria-label="Move down"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Toggle */}
          <button
            onClick={() => onToggle(item.id)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              item.visible ? 'bg-accent' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                item.visible ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

const DECADE_PRESETS = [
  { label: '60s', from: 1960, to: 1969 },
  { label: '70s', from: 1970, to: 1979 },
  { label: '80s', from: 1980, to: 1989 },
  { label: '90s', from: 1990, to: 1999 },
  { label: '00s', from: 2000, to: 2009 },
  { label: '10s', from: 2010, to: 2019 },
  { label: '20s', from: 2020, to: 2029 },
];

function CustomCarouselManager({
  carousels,
  onAdd,
  onUpdate,
  onRemove,
  onToggle,
  onMove,
}: {
  carousels: CustomCarousel[];
  onAdd: (c: Omit<CustomCarousel, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<CustomCarousel, 'id'>>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  const [showCreator, setShowCreator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatorType, setCreatorType] = useState<CustomCarousel['type']>('byYear');
  const [label, setLabel] = useState('');
  const [fromYear, setFromYear] = useState(2020);
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');

  // Load genres and playlists for pickers
  useEffect(() => {
    if (creatorType === 'byGenre' && genres.length === 0) {
      getSubsonicClient().getGenres().then((g) => {
        setGenres(g.map((x) => x.value).filter(Boolean).sort());
      }).catch(() => { /* silently fail */ });
    }
    if (creatorType === 'playlist' && playlists.length === 0) {
      getSubsonicClient().getPlaylists().then((p) => {
        setPlaylists(p.map((pl) => ({ id: pl.id, name: pl.name })));
      }).catch(() => { /* silently fail */ });
    }
  }, [creatorType, genres.length, playlists.length]);

  const buildCarouselData = (): Omit<CustomCarousel, 'id'> | null => {
    if (!label.trim()) return null;

    const carousel: Omit<CustomCarousel, 'id'> = {
      label: label.trim(),
      type: creatorType,
      visible: true,
    };

    if (creatorType === 'byYear' || creatorType === 'decade') {
      carousel.fromYear = fromYear;
      carousel.toYear = toYear;
    } else if (creatorType === 'byGenre') {
      carousel.genres = selectedGenres.length > 0 ? selectedGenres : [];
      if (carousel.genres.length === 0) return null;
    } else if (creatorType === 'playlist') {
      if (!selectedPlaylistId) return null;
      carousel.playlistId = selectedPlaylistId;
      carousel.playlistName = playlists.find((p) => p.id === selectedPlaylistId)?.name;
    }

    return carousel;
  };

  const handleCreate = () => {
    const data = buildCarouselData();
    if (!data) return;
    onAdd(data);
    resetForm();
  };

  const handleEdit = () => {
    if (!editingId) return;
    const data = buildCarouselData();
    if (!data) return;
    onUpdate(editingId, data);
    resetForm();
  };

  const startEdit = (c: CustomCarousel) => {
    setEditingId(c.id);
    setShowCreator(true);
    setCreatorType(c.type);
    setLabel(c.label);
    setFromYear(c.fromYear ?? 2020);
    setToYear(c.toYear ?? new Date().getFullYear());
    setSelectedGenres(c.genres ?? (c.genre ? [c.genre] : []));
    setSelectedPlaylistId(c.playlistId ?? '');
  };

  const resetForm = () => {
    setLabel('');
    setShowCreator(false);
    setEditingId(null);
    setSelectedGenres([]);
    setSelectedPlaylistId('');
  };

  return (
    <div className="space-y-4">
      {/* Existing custom carousels */}
      {carousels.length > 0 && (
        <div className="space-y-1">
          {carousels.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-lg bg-bg-tertiary/50 px-3 py-2.5"
            >
              <span className={`flex-1 text-sm ${c.visible ? 'text-text-primary' : 'text-text-muted'}`}>
                {c.label}
              </span>
              <span className="text-[10px] text-text-muted">
                {c.type === 'byYear' || c.type === 'decade' ? `${c.fromYear}–${c.toYear}` : c.type === 'byGenre' ? c.genre : 'Top Rated'}
              </span>

              {/* Move buttons */}
              <button
                onClick={() => i > 0 && onMove(i, i - 1)}
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-text-primary disabled:opacity-30"
                disabled={i === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => i < carousels.length - 1 && onMove(i, i + 1)}
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-text-primary disabled:opacity-30"
                disabled={i === carousels.length - 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Toggle */}
              <button
                onClick={() => onToggle(c.id)}
                className={`relative h-5 w-9 rounded-full transition-colors ${c.visible ? 'bg-accent' : 'bg-bg-tertiary'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${c.visible ? 'translate-x-4' : ''}`} />
              </button>

              {/* Edit */}
              <button
                onClick={() => startEdit(c)}
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-accent"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                </svg>
              </button>

              {/* Delete */}
              <button
                onClick={() => onRemove(c.id)}
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-red-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick decade presets */}
      {!showCreator && (
        <>
          <p className="text-xs text-text-muted">Quick add by decade:</p>
          <div className="flex flex-wrap gap-1.5">
            {DECADE_PRESETS.map((d) => (
              <button
                key={d.label}
                onClick={() => {
                  onAdd({ label: d.label, type: 'decade', visible: true, fromYear: d.from, toYear: d.to });
                }}
                className="rounded-full bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-accent hover:text-white transition-colors"
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Create custom button / form */}
      {!showCreator ? (
        <button
          onClick={() => setShowCreator(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          Create Custom Carousel
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-bg-tertiary/30 p-3">
          <h4 className="text-sm font-semibold text-text-primary">{editingId ? 'Edit Carousel' : 'New Custom Carousel'}</h4>

          {/* Type picker */}
          <div className="flex flex-wrap gap-1.5">
            {([
              { value: 'byYear', label: 'Year Range' },
              { value: 'byGenre', label: 'Genre' },
              { value: 'highest', label: 'Top Rated' },
              { value: 'playlist', label: 'Playlist' },
            ] as const).map((t) => (
              <button
                key={t.value}
                onClick={() => setCreatorType(t.value)}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition-colors ${
                  creatorType === t.value ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Name */}
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Carousel name"
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent"
          />

          {/* Year range */}
          {(creatorType === 'byYear' || creatorType === 'decade') && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
                min={1900} max={2099}
                className="w-20 rounded-lg border border-border bg-bg-secondary px-2 py-1.5 text-center text-sm text-text-primary outline-none focus:border-accent"
              />
              <span className="text-text-muted">to</span>
              <input
                type="number"
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
                min={1900} max={2099}
                className="w-20 rounded-lg border border-border bg-bg-secondary px-2 py-1.5 text-center text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Multi-genre picker */}
          {creatorType === 'byGenre' && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-lg border border-border bg-bg-secondary p-2">
                {genres.map((g) => {
                  const selected = selectedGenres.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        const updated = selected
                          ? selectedGenres.filter((x) => x !== g)
                          : [...selectedGenres, g];
                        setSelectedGenres(updated);
                        if (!label && updated.length === 1) setLabel(updated[0]);
                        if (!label && updated.length > 1) setLabel(updated.join(' + '));
                      }}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        selected ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
                {genres.length === 0 && <span className="text-xs text-text-muted">Loading genres...</span>}
              </div>
              {selectedGenres.length > 0 && (
                <p className="text-[10px] text-text-muted">{selectedGenres.length} genre{selectedGenres.length > 1 ? 's' : ''} selected</p>
              )}
            </div>
          )}

          {/* Playlist picker */}
          {creatorType === 'playlist' && (
            <select
              value={selectedPlaylistId}
              onChange={(e) => {
                setSelectedPlaylistId(e.target.value);
                const pl = playlists.find((p) => p.id === e.target.value);
                if (pl && !label) setLabel(pl.name);
              }}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            >
              <option value="">Select playlist...</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={editingId ? handleEdit : handleCreate}
              disabled={!label.trim() || (creatorType === 'byGenre' && selectedGenres.length === 0) || (creatorType === 'playlist' && !selectedPlaylistId)}
              className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
            >
              {editingId ? 'Save' : 'Create'}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
