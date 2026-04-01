import { useMemo } from 'react';
import { getSubsonicClient } from '../../api/SubsonicClient';
import { useUIStore } from '../../stores/uiStore';

interface DynamicBackgroundProps {
  coverArt?: string;
  children: React.ReactNode;
  className?: string;
}

export default function DynamicBackground({ coverArt, children, className = '' }: DynamicBackgroundProps) {
  const reduceMotion = useUIStore((s) => s.reduceMotion);

  // Memoize URL so it doesn't change on every render (prevents image reload/blink)
  const bgUrl = useMemo(
    () => coverArt ? getSubsonicClient().getCoverArt(coverArt, 300) : null,
    [coverArt],
  );

  const transition = reduceMotion ? 'none' : 'opacity 800ms ease';

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: '#000' }}>
      {/* Blurred album art background — fills entire viewport */}
      {bgUrl && (
        <img
          src={bgUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{
            filter: 'blur(40px) saturate(1.5)',
            transform: 'scale(1.2)',
            opacity: 0.65,
            transition,
          }}
        />
      )}

      {/* Dark gradient overlay for readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}
