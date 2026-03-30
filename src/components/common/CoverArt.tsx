import { useEffect, useRef, useState, useMemo } from 'react';
import { getSubsonicClient } from '../../api/SubsonicClient';

interface CoverArtProps {
  coverArt?: string;
  size?: number;
  className?: string;
}

// Stable URL cache: coverArt id+size → URL (avoids regenerating random salt)
const urlCache = new Map<string, string>();

function stableCoverArtUrl(coverArt: string, fetchSize: number): string {
  const key = `${coverArt}:${fetchSize}`;
  let url = urlCache.get(key);
  if (!url) {
    url = getSubsonicClient().getCoverArt(coverArt, fetchSize);
    urlCache.set(key, url);
  }
  return url;
}

// Track which URLs have successfully loaded
const loadedUrls = new Set<string>();

// Shared IntersectionObserver with large rootMargin to pre-load ahead
let observer: IntersectionObserver | null = null;
const callbacks = new Map<Element, () => void>();

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target);
            if (cb) {
              cb();
              callbacks.delete(entry.target);
              observer!.unobserve(entry.target);
            }
          }
        }
      },
      { rootMargin: '800px 0px' }
    );
  }
  return observer;
}

function PlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-2/5 w-2/5 text-text-muted"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19V6l12-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zm12-3c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2z"
      />
    </svg>
  );
}

export default function CoverArt({ coverArt, size, className = '' }: CoverArtProps) {
  const sizeStyle = size ? { width: size, height: size, minWidth: size } : undefined;
  const sizeClass = size ? '' : 'w-full aspect-square';

  if (!coverArt) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-bg-tertiary ${sizeClass} ${className}`}
        style={sizeStyle}
      >
        <PlaceholderIcon />
      </div>
    );
  }

  const fetchSize = size ? size * 2 : 320;
  // Stable URL — same coverArt+size always returns the same URL string
  const url = useMemo(() => stableCoverArtUrl(coverArt, fetchSize), [coverArt, fetchSize]);

  const cached = loadedUrls.has(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(cached);  // whether to render <img>
  const [loaded, setLoaded] = useState(cached);   // whether img has loaded

  // When coverArt changes, reset
  const prevUrl = useRef(url);
  useEffect(() => {
    if (prevUrl.current !== url) {
      prevUrl.current = url;
      const nowCached = loadedUrls.has(url);
      setActive(nowCached);
      setLoaded(nowCached);
    }
  }, [url]);

  // Observe for lazy loading
  useEffect(() => {
    if (active) return;

    const el = containerRef.current;
    if (!el) return;

    const obs = getObserver();
    callbacks.set(el, () => setActive(true));
    obs.observe(el);

    return () => {
      callbacks.delete(el);
      obs.unobserve(el);
    };
  }, [url, active]);

  const handleLoad = () => {
    loadedUrls.add(url);
    setLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-bg-tertiary ${sizeClass} ${className}`}
      style={sizeStyle}
    >
      {!loaded && <PlaceholderIcon />}
      {active && (
        <img
          src={url}
          alt=""
          decoding="async"
          className={`absolute inset-0 h-full w-full rounded-lg object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          onError={() => { setActive(false); setLoaded(false); }}
        />
      )}
    </div>
  );
}
