import { useEffect, useRef, useState, useCallback } from 'react';
import { getSubsonicClient } from '../../api/SubsonicClient';
import { extractWaveform } from '../../audio/waveformExtractor';

interface WaveformSeekbarProps {
  songId?: string;
  coverArt?: string; // used as part of stream URL
  progress: number; // 0 to 1
  onSeek: (progress: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
}

export default function WaveformSeekbar({ songId, progress, onSeek, onSeekStart, onSeekEnd }: WaveformSeekbarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const [currentSongId, setCurrentSongId] = useState<string | undefined>(songId);

  // Reset peaks when song changes (derived state)
  if (currentSongId !== songId) {
    setCurrentSongId(songId);
    setPeaks(null);
  }

  useEffect(() => {
    if (!songId) return;
    let cancelled = false;

    const url = getSubsonicClient().stream(songId);
    extractWaveform(songId, url).then((p) => {
      if (!cancelled) setPeaks(p);
    });

    return () => { cancelled = true; };
  }, [songId]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    if (!peaks) {
      // Flat bar fallback
      const barH = 4;
      const y = (h - barH) / 2;

      // Background
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--color-bg-tertiary').trim() || '#252532';
      ctx.beginPath();
      ctx.roundRect(0, y, w, barH, 2);
      ctx.fill();

      // Progress
      const accentColor = getComputedStyle(canvas).getPropertyValue('--color-accent').trim() || '#8b5cf6';
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(0, y, w * progress, barH, 2);
      ctx.fill();
      return;
    }

    const barWidth = Math.max(1, (w / peaks.length) - 1);
    const gap = 1;
    const maxBarH = h * 0.85;

    for (let i = 0; i < peaks.length; i++) {
      const x = i * (barWidth + gap);
      const barH = Math.max(2, peaks[i] * maxBarH);
      const y = (h - barH) / 2;

      const barProgress = x / w;
      const accentColor = getComputedStyle(canvas).getPropertyValue('--color-accent').trim() || '#8b5cf6';

      if (barProgress <= progress) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--color-bg-tertiary').trim() || '#252532';
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 1);
      ctx.fill();
    }
  }, [peaks, progress]);

  // Handle click/drag to seek
  const getProgressFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX : e.clientX;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    onSeekStart?.();
    onSeek(getProgressFromEvent(e));
  }, [onSeek, onSeekStart, getProgressFromEvent]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    onSeek(getProgressFromEvent(e));
  }, [dragging, onSeek, getProgressFromEvent]);

  const handlePointerUp = useCallback(() => {
    if (dragging) {
      setDragging(false);
      onSeekEnd?.();
    }
  }, [dragging, onSeekEnd]);

  return (
    <div
      ref={containerRef}
      className="relative w-full cursor-pointer"
      style={{ height: 40 }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
      />
      {/* Loading shimmer */}
      {!peaks && songId && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1 w-full animate-pulse rounded-full bg-bg-tertiary" />
        </div>
      )}
    </div>
  );
}
