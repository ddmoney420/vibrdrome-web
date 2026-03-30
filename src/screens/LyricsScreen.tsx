import { useState, useEffect, useRef } from 'react';
import { getSubsonicClient } from '../api/SubsonicClient';
import { usePlayerStore } from '../stores/playerStore';
import type { StructuredLyrics, LyricLine } from '../types/subsonic';
import { Header, LoadingSpinner } from '../components/common';

export default function LyricsScreen() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const seek = usePlayerStore((s) => s.seek);

  const [lyrics, setLyrics] = useState<StructuredLyrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const currentLineRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load lyrics when song changes
  useEffect(() => {
    if (!currentSong?.id) {
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

  // Auto-scroll to current line for synced lyrics
  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
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

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 pb-8">
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

        {!loading && lyrics && lyrics.synced && lyrics.line && (
          <div className="space-y-3 py-4">
            {lyrics.line.map((line, index) => {
              const currentIdx = getCurrentLineIndex(lyrics.line!);
              const isCurrent = index === currentIdx;
              return (
                <button
                  key={index}
                  ref={isCurrent ? currentLineRef : null}
                  onClick={() => {
                    if (line.start !== undefined) seek(line.start);
                  }}
                  className={`block w-full text-left text-lg font-medium transition-all duration-300 ${
                    isCurrent
                      ? 'scale-105 text-accent'
                      : index < currentIdx
                        ? 'text-text-muted'
                        : 'text-text-secondary'
                  }`}
                >
                  {line.value || '\u00A0'}
                </button>
              );
            })}
          </div>
        )}

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
