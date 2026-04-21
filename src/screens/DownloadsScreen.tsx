import { useEffect } from 'react';
import { useDownloadStore } from '../stores/downloadStore';
import type { CachedSong } from '../stores/downloadStore';
import { Header, CoverArt } from '../components/common';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function DownloadsScreen() {
  const { queue, cachedSongs, totalCachedSize, isDownloading, loadCachedSongs, removeFromCache, clearAllCached } = useDownloadStore();

  useEffect(() => {
    loadCachedSongs();
  }, [loadCachedSongs]);

  // Group cached songs by album
  const albumGroups = new Map<string, CachedSong[]>();
  for (const song of cachedSongs.values()) {
    const key = song.albumId || song.album || 'Unknown Album';
    const group = albumGroups.get(key) || [];
    group.push(song);
    albumGroups.set(key, group);
  }

  const hasContent = queue.length > 0 || cachedSongs.size > 0;

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Downloads" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="mx-auto max-w-lg">

          {/* Storage info */}
          {cachedSongs.size > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-bg-secondary p-3">
              <div>
                <p className="text-sm text-text-primary">{cachedSongs.size} songs cached</p>
                <p className="text-xs text-text-muted">{formatBytes(totalCachedSize)}</p>
              </div>
              <button
                onClick={clearAllCached}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Active downloads */}
          {queue.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {isDownloading ? 'Downloading...' : 'Queued'}
              </h2>
              <div className="space-y-1">
                {queue.map((item) => (
                  <div key={item.song.id} className="flex items-center gap-3 rounded-lg bg-bg-secondary p-3">
                    <CoverArt coverArt={item.song.coverArt} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text-primary">{item.song.title}</p>
                      <p className="truncate text-xs text-text-muted">{item.song.artist}</p>
                      {item.status === 'downloading' && (
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-tertiary">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${Math.round(item.progress * 100)}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'error' && (
                        <p className="mt-0.5 text-[10px] text-red-400">Download failed</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cached content grouped by album */}
          {albumGroups.size > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Available Offline
              </h2>
              <div className="space-y-4">
                {Array.from(albumGroups.entries()).map(([albumKey, songs]) => (
                  <div key={albumKey}>
                    <div className="mb-1 flex items-center gap-2">
                      <CoverArt coverArt={songs[0]?.coverArt} size={32} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{songs[0]?.album || albumKey}</p>
                        <p className="truncate text-xs text-text-muted">{songs[0]?.artist} — {songs.length} songs</p>
                      </div>
                    </div>
                    <div className="ml-10 space-y-0.5">
                      {songs.map((song) => (
                        <div key={song.songId} className="flex items-center justify-between py-1">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-text-secondary">{song.title}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-text-muted">{formatBytes(song.size)}</span>
                            <button
                              onClick={() => removeFromCache(song.songId)}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted hover:bg-bg-tertiary hover:text-red-400"
                              aria-label="Remove"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022 1.005 11.26A2.75 2.75 0 007.77 19.5h4.46a2.75 2.75 0 002.751-2.539l1.006-11.26.149.022a.75.75 0 10.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!hasContent && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-accent">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <h2 className="mb-1 text-lg font-semibold text-text-primary">No Downloads</h2>
              <p className="text-sm text-text-muted">
                Download albums or playlists for offline listening
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
