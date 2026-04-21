import { useState, useEffect, useRef } from 'react';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import { getPlaybackManager } from '../audio/PlaybackManager';
import type { StructuredLyrics, LyricLine } from '../types/subsonic';
import { Header, LoadingSpinner } from '../components/common';

export default function LyricsScreen() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const positionMs = usePlayerStore((s) => s.positionMs);

  const [lyrics, setLyrics] = useState<StructuredLyrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const currentLineRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastLineIdxRef = useRef(-1);

  // Load lyrics when song changes
  useEffect(() => {
    if (!currentSong?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear lyrics when no song
      setLyrics(null);
      return;
    }

    setLoading(true);
    setError(false);

    const load = async () => {
      try {
        const client = getSubsonicClient();
        const results = await client.getLyricsBySongId(currentSong.id);
        if (results.length > 0) {
          // Prefer synced lyrics
          const synced = results.find((l) => l.synced);
          setLyrics(synced ?? results[0]);
        } else {
          setLyrics(null);
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load lyrics:', err);
        setLyrics(null);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentSong?.id]);

  // Auto-scroll only when the current line index changes
  useEffect(() => {
    if (currentLineRef.current && containerRef.current) {
      const el = currentLineRef.current;
      const container = containerRef.current;
      const idx = Number(el.dataset.lineIdx ?? '-1');
      if (idx !== lastLineIdxRef.current) {
        lastLineIdxRef.current = idx;
        const elTop = el.offsetTop - container.offsetTop;
        const elHeight = el.offsetHeight;
        const containerHeight = container.clientHeight;
        const targetScroll = elTop - containerHeight / 2 + elHeight / 2;
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }, [positionMs]);

  const getCurrentLineIndex = (lines: LyricLine[]): number => {
    let currentIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      const start = lines[i].start ?? 0;
      if (start <= positionMs) {
        currentIdx = i;
      } else {
        break;
      }
    }
    return currentIdx;
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Lyrics" showBack />

      {/* Song info */}
      {currentSong && (
        <div className="px-4 pb-3">
          <h2 className="truncate text-lg font-bold text-text-primary">{currentSong.title}</h2>
          <p className="truncate text-sm text-text-secondary">{currentSong.artist}</p>
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 pb-20">
        {loading && <LoadingSpinner />}

        {!loading && !currentSong && (
          <div className="flex h-full items-center justify-center">
            <p className="text-text-muted">No song playing</p>
          </div>
        )}

        {!loading && currentSong && error && (
          <div className="flex h-full items-center justify-center">
            <p className="text-text-muted">No lyrics available</p>
          </div>
        )}

        {!loading && lyrics && lyrics.synced && lyrics.line && (() => {
          const currentIdx = getCurrentLineIndex(lyrics.line!);
          return (
          <div className="space-y-3 py-4">
            {lyrics.line!.map((line, index) => {
              const isCurrent = index === currentIdx;
              return (
                <button
                  key={index}
                  ref={isCurrent ? currentLineRef : null}
                  data-line-idx={index}
                  onClick={() => {
                    if (line.start !== undefined) {
                      getPlaybackManager().seek(line.start);
                      usePlayerStore.getState().setPosition(line.start);
                    }
                  }}
                  className={`block w-full text-left transition-all duration-300 ${
                    isCurrent
                      ? 'scale-105 text-xl font-bold text-accent'
                      : index < currentIdx
                        ? 'text-lg font-medium text-text-muted'
                        : 'text-lg font-medium text-text-secondary'
                  }`}
                >
                  {line.value || '\u00A0'}
                </button>
              );
            })}
          </div>
          );
        })()}

        {!loading && lyrics && !lyrics.synced && lyrics.line && (
          <div className="space-y-2 py-4">
            {lyrics.line.map((line, index) => (
              <p key={index} className="text-base text-text-primary">
                {line.value || '\u00A0'}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
