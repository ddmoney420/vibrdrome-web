const SHELL_CACHE = 'vibrdrome-shell-v2';
const AUDIO_CACHE = 'vibrdrome-audio-v1';
const ART_CACHE = 'vibrdrome-art-v1';
const SHELL_URLS = ['/', '/index.html'];
const MAX_AUDIO_CACHE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keepCaches = [SHELL_CACHE, AUDIO_CACHE, ART_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keepCaches.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // App shell — network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Audio streams — cache first if available (for offline playback)
  if (url.pathname.includes('/rest/stream')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request);
      })
    );
    return;
  }

  // Cover art — cache first with network fallback
  if (url.pathname.includes('/rest/getCoverArt')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(ART_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }
});

// Message handler for cache operations from the main thread
self.addEventListener('message', (event) => {
  const { type, url, requestInit } = event.data || {};

  if (type === 'CACHE_AUDIO') {
    // Download and cache an audio stream
    fetch(url, requestInit).then((response) => {
      if (response.ok) {
        caches.open(AUDIO_CACHE).then((cache) => {
          cache.put(new Request(url), response);
          // Notify client of completion
          event.source?.postMessage({ type: 'AUDIO_CACHED', url });
        });
      } else {
        event.source?.postMessage({ type: 'AUDIO_CACHE_ERROR', url, error: 'fetch failed' });
      }
    }).catch((err) => {
      event.source?.postMessage({ type: 'AUDIO_CACHE_ERROR', url, error: err.message });
    });
  }

  if (type === 'REMOVE_CACHED_AUDIO') {
    caches.open(AUDIO_CACHE).then((cache) => cache.delete(new Request(url)));
  }

  if (type === 'CLEAR_AUDIO_CACHE') {
    caches.delete(AUDIO_CACHE);
  }

  if (type === 'GET_CACHE_SIZE') {
    caches.open(AUDIO_CACHE).then(async (cache) => {
      const keys = await cache.keys();
      let totalSize = 0;
      for (const req of keys) {
        const resp = await cache.match(req);
        if (resp) {
          const blob = await resp.blob();
          totalSize += blob.size;
        }
      }
      event.source?.postMessage({ type: 'CACHE_SIZE', size: totalSize, count: keys.length });
    });
  }
});
