import { useEffect, useRef } from 'react';
import { getPlaybackManager } from '../../audio/PlaybackManager';
import { useUIStore } from '../../stores/uiStore';

const BAR_COUNT = 5;

export default function MiniWaveform({ isPlaying }: { isPlaying: boolean }) {
  const reduceMotion = useUIStore((s) => s.reduceMotion);
  const barsRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (reduceMotion || !isPlaying) {
      // Reset bars to idle state
      if (barsRef.current) {
        const bars = barsRef.current.children;
        for (let i = 0; i < bars.length; i++) {
          (bars[i] as HTMLElement).style.transform = 'scaleY(0.15)';
        }
      }
      return;
    }

    const analyser = getPlaybackManager().getAnalyser();
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);

      if (barsRef.current) {
        const bars = barsRef.current.children;
        const step = Math.floor(dataArray.length / BAR_COUNT / 2);

        for (let i = 0; i < BAR_COUNT; i++) {
          const value = dataArray[i * step + step] / 255;
          const scale = 0.15 + value * 0.85;
          (bars[i] as HTMLElement).style.transform = `scaleY(${scale})`;
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, reduceMotion]);

  return (
    <div ref={barsRef} className="flex items-end gap-[2px] h-4">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div
          key={i}
          className="w-[3px] origin-bottom rounded-full bg-accent transition-transform duration-75"
          style={{ height: '100%', transform: 'scaleY(0.15)' }}
        />
      ))}
    </div>
  );
}
