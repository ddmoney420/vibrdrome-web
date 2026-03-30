import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import AlbumCard from '../components/common/AlbumCard';
import Header from '../components/common/Header';
import type { Album } from '../types/subsonic';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedAlbums {
  data: Album[];
  fetchedAt: number;
}

const albumCache: Record<string, CachedAlbums> = {};

function isCacheValid(type: string): boolean {
  const cached = albumCache[type];
  return !!cached && Date.now() - cached.fetchedAt < CACHE_DURATION;
}

function useCachedAlbums(type: 'newest' | 'frequent' | 'random', size = 10) {
  const [albums, setAlbums] = useState<Album[]>(() => albumCache[type]?.data ?? []);
  const [loading, setLoading] = useState(() => !isCacheValid(type));

  useEffect(() => {
    if (isCacheValid(type)) {
      return;
    }

    let cancelled = false;

    getSubsonicClient()
      .getAlbumList2(type, size)
      .then((data) => {
        if (cancelled) return;
        albumCache[type] = { data, fetchedAt: Date.now() };
        setAlbums(data);
      })
      .catch(() => {
        // silently fail
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, size]);

  return { albums, loading };
}

interface PillButton {
  label: string;
  icon: React.ReactNode;
  action: () => void;
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

// Search and Settings icons for header
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

export default function LibraryScreen() {
  const navigate = useNavigate();
  const playSongs = usePlayerStore((s) => s.playSongs);

  const { albums: recentlyAdded, loading: loadingRecent } = useCachedAlbums('newest');
  const { albums: mostPlayed, loading: loadingFrequent } = useCachedAlbums('frequent');
  const { albums: randomPicks, loading: loadingRandom } = useCachedAlbums('random');

  const handleRandomMix = async () => {
    try {
      const songs = await getSubsonicClient().getRandomSongs(50);
      if (songs.length > 0) {
        playSongs(songs, 0);
      }
    } catch {
      // silently fail
    }
  };

  const handleRandomAlbum = async () => {
    try {
      const albums = await getSubsonicClient().getAlbumList2('random', 1);
      if (albums.length > 0) {
        navigate(`/album/${albums[0].id}`);
      }
    } catch {
      // silently fail
    }
  };

  const pills: PillButton[] = [
    { label: 'Genres', icon: IconTag, action: () => navigate('/genres') },
    { label: 'Radio', icon: IconRadio, action: () => navigate('/radio') },
    { label: 'Artists', icon: IconUsers, action: () => navigate('/artists') },
    { label: 'Favorites', icon: IconStar, action: () => navigate('/favorites') },
    { label: 'Albums', icon: IconDisc, action: () => navigate('/albums') },
    { label: 'Folders', icon: IconFolder, action: () => navigate('/folders') },
    { label: 'Songs', icon: IconMusic, action: () => navigate('/songs') },
    { label: 'Downloads', icon: IconDownload, action: () => navigate('/downloads') },
    { label: 'Playlists', icon: IconList, action: () => navigate('/playlists') },
    { label: 'Recently Added', icon: IconClock, action: () => navigate('/albums?type=newest') },
    { label: 'Generations', icon: IconSparkles, action: () => navigate('/generations') },
    { label: 'Recently Played', icon: IconClock, action: () => navigate('/albums?type=recent') },
    { label: 'Random Mix', icon: IconShuffle, action: handleRandomMix },
    { label: 'Random Album', icon: IconShuffle, action: handleRandomAlbum },
  ];

  const rightActions = (
    <>
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

      {/* Quick access pills */}
      <div className="grid grid-cols-2 gap-1.5 px-3 pb-4 md:gap-2 md:px-4 md:pb-6">
        {pills.map((pill) => (
          <button
            key={pill.label}
            onClick={pill.action}
            className="flex items-center gap-2 rounded-full bg-bg-secondary px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-tertiary md:gap-2.5 md:px-4 md:py-2.5"
          >
            <span className="text-text-secondary">{pill.icon}</span>
            <span className="truncate">{pill.label}</span>
          </button>
        ))}
      </div>

      {/* Carousels */}
      <AlbumCarousel
        title="Recently Added"
        albums={recentlyAdded}
        loading={loadingRecent}
        onSeeAll={() => navigate('/albums?type=newest')}
      />
      <AlbumCarousel
        title="Most Played"
        albums={mostPlayed}
        loading={loadingFrequent}
        onSeeAll={() => navigate('/albums?type=frequent')}
      />
      <AlbumCarousel
        title="Random Picks"
        albums={randomPicks}
        loading={loadingRandom}
        onSeeAll={() => navigate('/albums?type=random')}
      />
    </div>
  );
}

function AlbumCarousel({
  title,
  albums,
  loading,
  onSeeAll,
}: {
  title: string;
  albums: Album[];
  loading: boolean;
  onSeeAll: () => void;
}) {
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
          {albums.map((album) => (
            <div key={album.id} className="snap-start shrink-0">
              <AlbumCard album={album} size="small" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
