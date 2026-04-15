import { useState, useEffect } from 'react';
import { getCastManager } from '../../audio/CastManager';
import { useUIStore } from '../../stores/uiStore';

export default function CastButton() {
  const [available, setAvailable] = useState(false);
  const castConnected = useUIStore((s) => s.castConnected);
  useEffect(() => {
    getCastManager().loadSdk().then(setAvailable);
  }, []);

  if (!available) return null;

  const handleClick = () => {
    const cm = getCastManager();
    if (castConnected) {
      cm.endSession();
    } else {
      cm.requestSession();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        castConnected
          ? 'text-accent'
          : 'text-text-secondary hover:bg-bg-tertiary'
      }`}
      aria-label={castConnected ? 'Stop casting' : 'Cast to device'}
      title={castConnected ? 'Stop casting' : 'Cast to device'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        {castConnected ? (
          // Cast connected icon (filled)
          <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2a9 9 0 019 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3z" />
        ) : (
          // Cast icon (outline)
          <path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2a9 9 0 019 9h2c0-6.08-4.93-11-11-11z" />
        )}
      </svg>
    </button>
  );
}
