import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
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
      const page = await client.getAlbumList2(type, PAGE_SIZE, offset, genre, fromYear, toYear);
      if (page.length < PAGE_SIZE) setHasMore(false);

      setAlbums((prev) => (isInitial ? page : [...prev, ...page]));
      offsetRef.current = offset + page.length;
    } catch (err) {
      console.error('Failed to load albums:', err);
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }, [type, genre, fromYear, toYear]);

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

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title={title} showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title={title} showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
          {albums.map((album) => (
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
