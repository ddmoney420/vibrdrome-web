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

  const fetchSize = size ? size * 2 : 320;

  // Stable URL — same coverArt+size always returns the same URL string.
  // When coverArt is undefined we pass a dummy value; the URL won't be used.
  const url = useMemo(
    () => (coverArt ? stableCoverArtUrl(coverArt, fetchSize) : ''),
    [coverArt, fetchSize],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Track which URL the active/loaded state belongs to. When url changes,
  // we reset by detecting the mismatch during render (no effect needed).
  const [imgState, setImgState] = useState(() => {
    const cached = url ? loadedUrls.has(url) : false;
    return { url, active: cached, loaded: cached };
  });

  // If the url changed since last render, reset state synchronously (derived state pattern)
  if (imgState.url !== url) {
    const cached = url ? loadedUrls.has(url) : false;
    setImgState({ url, active: cached, loaded: cached });
  }

  const { active, loaded } = imgState;
  const setActive = (v: boolean) => setImgState((s) => ({ ...s, active: v }));
  const setLoaded = (v: boolean) => setImgState((s) => ({ ...s, loaded: v }));

  // Observe for lazy loading
  useEffect(() => {
    if (active || !coverArt) return;

    const el = containerRef.current;
    if (!el) return;

    const obs = getObserver();
    callbacks.set(el, () => setActive(true));
    obs.observe(el);

    return () => {
      callbacks.delete(el);
      obs.unobserve(el);
    };
  }, [url, active, coverArt]);

  const handleLoad = () => {
    loadedUrls.add(url);
    setLoaded(true);
  };

  // No cover art — show placeholder without image machinery
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
