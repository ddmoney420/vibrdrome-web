import { useState, useEffect, useRef } from 'react';
import { getSubsonicClient } from '../../api/SubsonicClient';
import { usePlayerStore } from '../../stores/playerStore';
import { getPlaybackManager } from '../../audio/PlaybackManager';
import type { StructuredLyrics, LyricLine } from '../../types/subsonic';

export default function NowPlayingLyrics() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const songId = currentSong?.id;

  const [lyrics, setLyrics] = useState<StructuredLyrics | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const currentLineRef = useRef<HTMLButtonElement | null>(null);
  const loadedForRef = useRef<string | null>(null);

  // Detect song change and load lyrics
  if (songId !== loadedForRef.current) {
    loadedForRef.current = songId ?? null;
    if (songId) {
      setStatus('loading');
      setLyrics(null);
    } else {
      setStatus('idle');
      setLyrics(null);
    }
  }

  useEffect(() => {
    if (!songId || status !== 'loading') return;

    let cancelled = false;

    getSubsonicClient()
      .getLyricsBySongId(songId)
      .then((results) => {
        if (cancelled) return;
        if (results.length > 0) {
          const synced = results.find((l) => l.synced);
          setLyrics(synced ?? results[0]);
          setStatus('idle');
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  }, [songId, status]);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastLineIdxRef = useRef(-1);
  useEffect(() => {
    if (currentLineRef.current && containerRef.current) {
      const el = currentLineRef.current;
      const container = containerRef.current;
      const idx = Number(el.dataset.lineIdx ?? '-1');
      if (idx !== lastLineIdxRef.current) {
        lastLineIdxRef.current = idx;
        // Scroll within container only — avoids scrollIntoView bubbling to parent elements
        const elTop = el.offsetTop;
        const elHeight = el.offsetHeight;
        const containerHeight = container.clientHeight;
        const targetScroll = elTop - containerHeight / 2 + elHeight / 2;
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }, [positionMs]);

  const getCurrentLineIndex = (lines: LyricLine[]): number => {
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if ((lines[i].start ?? 0) <= positionMs) idx = i;
      else break;
    }
    return idx;
  };

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-bg-tertiary border-t-accent" />
      </div>
    );
  }

  if (!currentSong || status === 'error' || !lyrics) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-muted">{!currentSong ? 'No song playing' : 'No lyrics available'}</p>
      </div>
    );
  }

  if (lyrics.synced && lyrics.line) {
    const currentIdx = getCurrentLineIndex(lyrics.line);
    return (
      <div ref={containerRef} className="h-full overflow-y-auto px-4 py-4 space-y-2">
        {lyrics.line.map((line, i) => (
          <button
            key={i}
            ref={i === currentIdx ? currentLineRef : null}
            data-line-idx={i}
            onClick={() => {
              if (line.start !== undefined) {
                getPlaybackManager().seek(line.start);
                usePlayerStore.getState().setPosition(line.start);
              }
            }}
            className={`block w-full text-left transition-all duration-300 ${
              i === currentIdx
                ? 'text-base font-bold text-accent'
                : i < currentIdx
                  ? 'text-sm text-text-muted'
                  : 'text-sm text-text-secondary'
            }`}
          >
            {line.value || '\u00A0'}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-1.5">
      {lyrics.line?.map((line, i) => (
        <p key={i} className="text-sm text-text-primary">{line.value || '\u00A0'}</p>
      ))}
    </div>
  );
}
