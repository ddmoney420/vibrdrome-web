import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { useMusicFolderStore } from '../stores/musicFolderStore';
import type { Album, AlbumListType } from '../types/subsonic';
import { Header, AlbumCard, LoadingSpinner } from '../components/common';

const PAGE_SIZE = 40;

export default function AlbumsListScreen() {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as AlbumListType) || 'newest';
  const genre = searchParams.get('genre') || undefined;
  const fromYear = searchParams.get('fromYear') ? Number(searchParams.get('fromYear')) : undefined;
  const toYear = searchParams.get('toYear') ? Number(searchParams.get('toYear')) : undefined;
  const title = searchParams.get('title') || 'Albums';
  const activeFolderId = useMusicFolderStore((s) => s.activeFolderId);

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(async (offset: number, isInitial: boolean) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const client = getSubsonicClient();
      const page = await client.getAlbumList2(type, PAGE_SIZE, offset, genre, fromYear, toYear, activeFolderId ?? undefined);
      if (page.length < PAGE_SIZE) setHasMore(false);

      setAlbums((prev) => (isInitial ? page : [...prev, ...page]));
      offsetRef.current = offset + page.length;
    } catch (err) {
      console.error('Failed to load albums:', err);
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }, [type, genre, fromYear, toYear, activeFolderId]);

  useEffect(() => {
    offsetRef.current = 0;
    setAlbums([]);
    setHasMore(true);
    fetchPage(0, true);
  }, [fetchPage]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPage(offsetRef.current, false);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchPage]);

  const [filterText, setFilterText] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title={title} showBack />
        <LoadingSpinner />
      </div>
    );
  }

  const filteredAlbums = filterText
    ? albums.filter((a) => {
        const q = filterText.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.artist?.toLowerCase().includes(q);
      })
    : albums;

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title={`${title}${filteredAlbums.length > 0 ? ` (${filteredAlbums.length})` : ''}`} showBack />

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            showFilter || filterText ? 'border-accent text-accent' : 'border-border text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
          Filter
        </button>
        {showFilter && (
          <>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search albums or artists..."
              className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent"
              autoFocus
            />
            {filterText && (
              <button onClick={() => setFilterText('')} className="text-xs text-accent hover:underline">Clear</button>
            )}
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
          {filteredAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>

        {/* Sentinel element for triggering next page load */}
        {hasMore && (
          <div ref={sentinelRef} className="py-4">
            {loadingMore && <LoadingSpinner />}
          </div>
        )}

        {!hasMore && albums.length === 0 && (
          <p className="py-8 text-center text-text-muted">No albums found.</p>
        )}
      </div>
    </div>
  );
}
