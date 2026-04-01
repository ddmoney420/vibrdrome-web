import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getSubsonicClient } from '../../api/SubsonicClient';
import { useUIStore } from '../../stores/uiStore';
import { extractDominantColor } from '../../utils/colorExtractor';

interface DynamicBackgroundProps {
  coverArt?: string;
  children: React.ReactNode;
  className?: string;
}

// Simple external store for dominant color to avoid setState-in-effect lint issues
const colorStore = {
  value: null as string | null,
  listeners: new Set<() => void>(),
  set(v: string | null) {
    if (v === this.value) return;
    this.value = v;
    this.listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  },
  getSnapshot() { return colorStore.value; },
};

export default function DynamicBackground({ coverArt, children, className = '' }: DynamicBackgroundProps) {
  const reduceMotion = useUIStore((s) => s.reduceMotion);
  const bgColor = useSyncExternalStore(colorStore.subscribe, colorStore.getSnapshot);
  const currentCoverRef = useRef(coverArt);

  useEffect(() => {
    currentCoverRef.current = coverArt;

    if (!coverArt) {
      colorStore.set(null);
      return;
    }

    const url = getSubsonicClient().getCoverArt(coverArt, 100);

    extractDominantColor(url, coverArt)
      .then((color) => {
        // Only apply if this is still the current cover art
        if (currentCoverRef.current !== coverArt) return;
        colorStore.set(`${color.r}, ${color.g}, ${color.b}`);
      })
      .catch(() => {
        if (currentCoverRef.current === coverArt) colorStore.set(null);
      });
  }, [coverArt]);

  const transitionStyle = reduceMotion ? undefined : { transition: 'background 800ms ease' };

  return (
    <div
      className={`relative ${className}`}
      style={{
        background: bgColor
          ? `linear-gradient(to bottom, rgba(${bgColor}, 0.25) 0%, rgba(${bgColor}, 0.08) 40%, var(--color-bg-primary) 100%)`
          : 'var(--color-bg-primary)',
        ...transitionStyle,
      }}
    >
      {children}
    </div>
  );
}
