# Changelog

All notable changes to Vibrdrome Web are documented here.

## [1.9.0-beta.12] - 2026-06-21

### Added
- **Display-only HUD ★ indicator** for favorited visualizer presets.

### Notes
- The ★ appears beside the HUD preset name when the current preset is favorited.
- The indicator is **display-only and not clickable**.
- The existing control-bar **☆/★ button remains the only favorite toggle**.
- **No outline ☆** is shown for non-favorites.
- **Shader / non-Milkdrop mode does not show the indicator.**
- **Favorite identity/storage is unchanged.**
- **Search, ★ Only, next/previous, random, auto-advance, and `?preset=` are unchanged.**
- No rendering, engine, crossfade, preset-bundle, dependency, workflow, or Dockerfile changes.
- Deferred (not in this release): favoriting keyboard shortcut, orphaned-favorite cleanup, and cross-device sync.

## [1.9.0-beta.11] - 2026-06-21

### Added
- **Favorites-only next / previous** visualizer navigation — completes ★ Only mode so manual navigation respects your favorites too.

### Notes
- When **★ Only** is enabled and active-engine favorites exist, next/previous cycle through favorites in active-list order (wrapping).
- When **★ Only** is disabled, next/previous remain **global**.
- **Zero favorites falls back to global behavior**, so playback never strands.
- **One favorite** safely parks on that favorite.
- **Search and `?preset=` remain global / explicit** — you can still reach any preset in ★ Only mode.
- **Random and auto-advance behavior are unchanged** from beta.10.
- No rendering, engine, crossfade, preset-bundle, dependency, workflow, or Dockerfile changes.
- Deferred (not in this release): HUD ★ indicator, favoriting keyboard shortcut, orphaned-favorite cleanup, and cross-device sync.

## [1.9.0-beta.10] - 2026-06-21

### Added
- **★ Only visualizer playback mode** — restrict hands-off playback to your favorited presets.
- **Favorites-only random / double-click** preset selection.
- **Favorites-only auto-advance.**

### Notes
- With shuffle enabled, auto-advance picks **random favorites**; with shuffle disabled, it advances through favorites in **active-list order**.
- **Zero favorites falls back to global behavior**, so playback never strands or goes black.
- **One favorite** safely parks on that favorite.
- **next / previous remain global and unchanged.**
- The setting persists locally via `vibrdrome_visualizer_favorites_only`.
- No rendering, engine, crossfade, preset-bundle, dependency, workflow, or Dockerfile changes.
- Deferred (not in this release): next/previous favorites-only cycling, HUD ★ indicator, favoriting keyboard shortcut, orphaned-favorite cleanup, and cross-device sync.

## [1.9.0-beta.9] - 2026-06-21

### Added
- **Visualizer preset favorites** (local-only) — save the presets you like and jump back to them.
- ☆/★ **favorite toggle for the current preset** in the visualizer controls.
- **Per-row favorite stars** inside preset search.
- A **Favorites filter** inside preset search to show only favorited presets.

### Notes
- Favorites are stored **locally** in a versioned `localStorage` blob; bad/old data degrades safely to empty.
- Identity: projectM favorites use the stable preset **path**; butterchurn favorites use the engine-prefixed preset **name**.
- Selecting a favorite reuses the existing preset-switch path, so hard-cut / live crossfade / reduced-motion / butterchurn / next-prev-random / auto-advance behavior is unchanged.
- No rendering, engine, crossfade, preset-bundle, dependency, workflow, or Dockerfile changes.
- Deferred (not in this release): HUD ★ indicator beside the preset name, a favoriting keyboard shortcut, favorites-only random/auto-advance, orphaned-favorite cleanup, and cross-device sync.

## [1.9.0-beta.8] - 2026-06-21

### Added
- **Visualizer preset search** — find and jump to a Milkdrop preset by name. Open it with the `/` shortcut or the **🔍 Find** button in the visualizer controls; fuzzy-filters the active engine's preset list (projectM/WebGPU or butterchurn), with results capped for performance and a "refine your search" hint when there are more matches.
- **Read-only `?preset=` deep-link** — opening the visualizer with `?preset=<name>` jumps to the first matching preset (handy for sharing / bug reports). It never rewrites the URL.

### Notes
- Selecting a search result reuses the existing preset-switch path, so **hard-cut, live engine crossfade (`fade`), reduced-motion suppression, and butterchurn behavior are all preserved** unchanged.
- No rendering, engine, preset-bundle, dependency, workflow, or Dockerfile changes.

## [1.9.0-beta.7] - 2026-06-21

### Changed
- Updated the Cloudflare Pages deploy action from `cloudflare/wrangler-action@v3` to `@v4`. This clears the Node 20 deprecation warning seen during recent (successful) production deploys.

### Notes
- Deploy-maintenance beta only — **no app runtime changes, no visualizer changes, no dependency changes.**

## [1.9.0-beta.6] - 2026-06-21

### Changed
- **Live engine-level projectM/WebGPU preset crossfade.** When the existing "Crossfade preset transitions" (`fade`) setting is on, projectM/WebGPU preset switches now blend in the **engine** — both the outgoing and incoming presets keep rendering live and their outputs are mixed across the transition — instead of fading a frozen still of the old frame. Re-vendored `pm-web` WASM exposing the new `transition_to_preset` API; engine source fix is [`projectM-rs#2`](https://github.com/ddmoney420/projectM-rs/pull/2).

### Notes
- **Hard-cut remains the default**; the live crossfade only applies when `fade` is enabled.
- **Reduced motion** (in-app setting or `prefers-reduced-motion`) still suppresses the transition (hard-cut).
- **Butterchurn** (WebGL fallback) behavior is unchanged.
- The previous **frozen-frame crossfade remains as a fallback** for older/unavailable pm-web builds (feature-detected). No UI/settings change.

## [1.9.0-beta.5] - 2026-06-21

### Fixed
- **projectM feedback-buffer inheritance** — feedback/transition-style Milkdrop presets that draw from the previous frame (e.g. "Angels Of Glory … Isosceles edit", "Goody – Growth effect", "nematodes (Reverse Jelly V3)", "Water Baqteria") no longer render as a black screen after a preset switch. The projectM/WebGPU engine now copies the previous preset's last completed frame into the newly-loaded preset's feedback buffer (a GPU texture-to-texture copy; a cold first-load with no prior frame is unchanged), so these presets inherit previous-frame content instead of starting from black. Ships as a re-vendored `pm-web` WASM build; engine source fix is [`projectM-rs#1`](https://github.com/ddmoney420/projectM-rs/pull/1).

### Changed
- Dev-tooling/dependency refresh (dev-dependencies group). **Vite unpinned from `8.0.9` to `8.0.16`** after explicit production-preview validation against the 1.9.0-beta.1 black-screen / entry-chunking failure (the `npm run test:smoke` guard remains wired into CI). No production-dependency policy changes.

### Notes
- No application source changed in this release beyond version metadata; the projectM fix is entirely in the re-vendored engine WASM. Preset switching remains a hard cut by default.

## [1.9.0-beta.4] - 2026-06-20

### Added
- Optional projectM/WebGPU **frozen-frame preset crossfade** — fades the old preset out over the new one. Default off (hard-cut), with a Settings → Visualizer toggle; falls back silently to a hard cut on capture failure and is suppressed under Reduce Motion / `prefers-reduced-motion`.
- **Pin visualizer player controls** — keep the in-visualizer playback controls on screen instead of auto-hiding (Settings + a control-bar toggle).

### Changed
- **Quiet auto-advance** — when auto-advance changes the visualizer preset, it no longer wakes the overlay or shows the preset-name toast (the optional transition vignette still plays).
- Production dependency refresh (React, React DOM, React Router, Zustand, Tailwind Vite plugin, `@types/react`); **Vite intentionally remains pinned to `8.0.9`** and no other dependency policy changed.

### Notes
- Beta tags now publish as **GitHub prereleases** — effective once this reaches `master` (the first prerelease-flagged tag is `v1.9.0-beta.4`).
- No projectM engine / WASM behavior changed; preset switching remains a hard cut by default.

## [1.9.0-beta.3] - 2026-06-20

### Added
- Fullscreen toggle in the visualizer overlay — feature-detected, with WebKit fallbacks; hidden where the Fullscreen API is unsupported (e.g. iOS Safari).
- Optional in-visualizer playback controls (now-playing transport: cover art, title/artist, play/pause, previous/next, seek, and desktop volume/mute), reusing the existing playback APIs and components. Default OFF.
- Visualizer HUD polish: clearer preset name plus engine/position/auto/shuffle/frozen status badges, and a brief preset-name toast when the preset changes.
- Optional, reduced-motion-safe transition vignette polish: a subtle DOM/CSS vignette dip around the (still hard-cut) preset switch. Default OFF.
- Optional 2D-canvas particle overlay: a subtle audio-reactive particle layer with particle-count and device-pixel-ratio caps plus low-FPS throttling. Default OFF.

### Notes
- Particles and transition polish are opt-in and reduced-motion aware: both are suppressed when Reduce Motion or `prefers-reduced-motion: reduce` is active.
- No projectM engine / WASM behavior changed; preset switching remains a hard cut. No real crossfade or screenshot/readback transition work is included.

## [1.9.0-beta.2] - 2026-06-20

### Fixed
- Production black-screen on load: Vite 8.0.10 chunked `zustand`'s `create` into the entry chunk, creating a circular entry ↔ `uiStore` dependency — `uiStore` evaluated before `create` was initialized (`TypeError: create is not a function`), so React never mounted and `#root` stayed empty. (Regression in 1.9.0-beta.1.)

### Changed
- Pinned Vite to 8.0.9 (the chunk output that keeps `create` in a vendor chunk) pending an upstream-safe upgrade path.

### Added
- Production-preview smoke test (`npm run test:smoke`): builds the app, serves the minified bundle via `vite preview`, loads it in headless Chromium, and fails on console errors or an empty `#root`. Wired into the required CI build job so production-bundle-only crashes are caught before release.

### Notes
- No projectM visualizer behavior changed; this release is the 1.9.0-beta.1 feature set plus the production-bundle fix and smoke guard.

## [1.9.0-beta.1] - 2026-06-19

### Added
- **projectM Milkdrop visualizer** — a WebGPU-based Milkdrop engine using projectM-rs compiled to WebAssembly. projectM is used as the primary Milkdrop visualizer when WebGPU is available, with butterchurn retained as the WebGL fallback.
- Official projectM preset corpus bundled with 10,347 presets as gzipped shards, cached in IndexedDB with lazy per-category loading.
- Visualizer controls for auto-advance with interval, shuffle, freeze, single-step, FPS overlay, info HUD, and keyboard shortcuts.
- Settings → Visualizer options for force-butterchurn engine, auto-advance, auto-advance interval, and shuffle.
- Documented Picture-in-Picture support.

### Changed
- The Milkdrop visualizer now reacts to live playback audio through the PlaybackManager analyser.

### Licensing
- Added LGPL-2.1 license text, source availability notice, and app-visible attribution for the vendored projectM-rs visualizer engine.

## [1.8.1-beta.2] - 2026-05-05

### Fixed
- Chromecast progress bar froze at 0:00 — position now reads from the cast MediaSession's `getEstimatedTime()` (with `CURRENT_TIME_CHANGED` fallback) instead of the silent local audio element
- Chromecast disconnect (user end-session, network drop, AutoJoin timeout) now resumes playback locally at the same position instead of going silent — Spotify-Connect-style handoff
- Docker healthcheck failed on IPv6-only `localhost` resolution

### Security
- Dockerfile now runs `apk upgrade --no-cache` on the nginx:alpine base, picking up CVE-2026-27135 (HIGH, nghttp2-libs DoS) and any future Alpine security patches at build time

### Changed
- Replaced dynamic `import('./CastManager')` chains in `pause`/`seek`/`setVolume`/`play` with a top-level static import — rapid slider drags no longer spawn out-of-order Promises
- `seek()` no longer touches the local audio element while casting (was logically incorrect; silent in practice)
- Upgraded dev deps: ESLint 10, TypeScript 6, react-hooks 7.1.1; resolved all lint errors

### Tests
- Added 11 unit tests covering `CastManager.getCurrentTime` (with fallbacks), `onSessionEnd` callback delivery, and `PlaybackManager` cast-mode routing for `getPosition`/`seek`/`pause`/`setVolume`

## [1.8.1-beta.1] - 2026-04-21

### Added
- Server-side queue sync via OpenSubsonic `indexBasedQueue` extension (Navidrome 0.61+)
- Opt-in "Sync Queue" toggle in Settings > Integrations
- Debounced queue saves (1.5s) to avoid hammering on rapid changes
- Periodic playback position sync every 30s and on pause
- Queue restoration from server on startup when local queue is empty
- Feature detection: falls back to legacy `savePlayQueue`/`getPlayQueue` for non-OpenSubsonic servers
- Local position persistence — playback position saved to localStorage on pause and page unload, restored on reload

### Fixed
- Gapless playback: tracks now advance in correct order when clicking next (spurious ended events no longer trigger wrong preloaded track)
- Now Playing reports accurate time after page reload (position restores from localStorage or server)

---

## [1.8.0] - 2026-04-14

### Added
- Offline playback — download albums and playlists for offline listening
- Download button on album and playlist detail screens
- Downloads screen with active downloads, progress tracking, and cached content grouped by album
- Storage usage indicator with clear all option
- Service worker rewrite: cache-first strategy for audio streams, automatic cover art caching
- DownloadManager with sequential download queue and byte-level progress tracking

---

## [1.7.0] - 2026-04-14

### Added
- Gapless playback — seamless track transitions when crossfade is disabled, pre-buffers next track 15s before end
- Gapless toggle in Settings > Playback (on by default, disabled when crossfade is active)
- Chromecast support — cast audio to Chromecast devices via Google Cast SDK
- Cast button in mini-player (only visible when Cast SDK loads successfully)
- Cast-aware play, pause, seek, and volume controls

### Note
- Chromecast requires the Subsonic server to be network-accessible to the Chromecast device

---

## [1.6.5] - 2026-04-14

### Added
- ReplayGain peak prevention — clamps gain to prevent clipping when gain x peak > 1.0
- ReplayGain mode picker in Settings — choose Track, Album, or Off
- Import/export settings — back up and restore all preferences as JSON (excludes server credentials)
- Playlist sharing links — share button generates deep link with server URL + playlist ID
- Share route (`/share`) — opens shared playlist or prompts login for different server

---

## [1.6.4] - 2026-04-14

### Added
- Docker default server URL injection via `VIBRDROME_DEFAULT_SERVER` env var — pre-fills login screen for self-hosted deployments
- Keyboard shortcuts overlay — press `?` to view all shortcuts
- Desktop notifications on track change — enable in Settings > Integrations
- Configurable sleep timer fade duration (10s, 30s, 60s) with exponential curve for natural-sounding fade
- Docker entrypoint script for runtime configuration

### Changed
- Sleep timer fade now uses exponential curve instead of linear for more natural volume reduction

---

## [1.6.3] - 2026-04-08

### Added
- Volume control on mini-player — inline slider on hover, click icon to mute/unmute

---

## [1.6.2] - 2026-04-07

### Fixed
- Lyrics auto-scroll no longer hijacks parent layout on desktop Now Playing — back button and tab headers stay visible
- Same fix applied to full-screen Lyrics view

### Added
- Discord bug report template (`bug-report-template.md`)
- Discord feature request template (`feature-request-template.md`)

---

## [1.6.1] - 2026-04-06

### Added
- Pop-out mini player: draggable floating window with S/M/L/XL sizes
- Scalable waveform seekbar in pop-out player (30-120px height)
- macOS-style traffic light controls (close/minimize/maximize)
- Pop-out button in mini-player toolbar

### Fixed
- Lyrics tab crash during radio playback (React error #301)
- Volume slider not affecting radio streams
- Mixed content warning from HTTP Wikimedia image URLs
- seek() now actually seeks audio (not just UI)
- Spam-click protection on radio, star toggle, artist radio

### Developer
- Unit testing framework: Vitest + happy-dom + @testing-library/react
- 120 tests across 11 suites (stores, API clients, utilities, hooks)
- `npm run test` / `npm run test:run` scripts

---

## [1.6.0] - 2026-04-02

### Added
- Radio in mini-player: play/pause, stop, station artwork, full-screen radio view
- Split-pane right panel: radio-aware controls with live indicator
- Smart playlists: Heavy Rotation, Forgotten Gems, Recently Added Unplayed
- Configurable smart playlist thresholds (days/months)
- Stream quality picker: Original, 320k, 256k, 192k, 128k, 96k
- EQ limiter prevents bass boost clipping/distortion
- Waveform seekbar on desktop Now Playing and split-pane
- Drag-and-drop queue reorder (QueueScreen + Now Playing panel)
- Multi-select with batch actions (Play, Play Next, Add to Queue)
- Play history tracking in IndexedDB
- Mini-player: previous, next, repeat buttons
- Album filters: genre dropdown, year input
- Artist filters: genre dropdown, artist radio
- In-app first-run tooltips
- Smart Playlists pill on library
- Radio artwork fix (ra- prefix workaround for Navidrome bug #5293)
- Browse similar artist bios inline on artist detail page (no search redirect)
- Spam-click protection on radio, star toggle, artist radio

### Fixed
- Radio and song playback no longer mix
- Stopping radio returns to last song without auto-playing
- seek() now actually seeks audio (not just UI)
- Suppress false audio error logs during radio
- Duplicate React key warning in custom carousels
- lodash security vulnerability patched

---

## [1.5.0] - 2026-04-02

### Added
- Split-pane desktop view with Playing, Queue, and Lyrics tabs
- Waveform seekbar on desktop Now Playing and split-pane
- Drag-and-drop queue reorder (desktop and Now Playing panel)
- Multi-select with batch actions (Play, Play Next, Add to Queue)
- Play history tracking in IndexedDB
- Album filters: search by name/artist, genre dropdown, year input
- Artist filters: search by name, genre dropdown
- Artist radio: one-click play similar/top songs
- In-app first-run tooltips
- CHANGELOG.md

---

## [1.4.0] - 2026-04-01

### Added
- Radio station artwork from Navidrome 0.61
- PLS/M3U playlist file parsing for radio streams
- Songs screen: infinite scroll, artist/genre/year filters
- Sidebar counts: artists, genres, playlists, radio
- Playlists carousel on Library screen
- Playlist artwork grid layout

### Removed
- Downloads screen (offline is native app only)

### Fixed
- Radio not playing (PLS/M3U support)
- Inaccurate song/album counts removed

---

## [1.3.0] - 2026-04-01

### Added
- 8 theme skins: Dark, Light, zApple Light, zApple Dark, Retro, Terminal, Midnight, Sunset
- Theme picker with mini preview cards
- Custom carousel creator: year range, genre (multi-select), decade, playlist, top rated
- Edit/rename custom carousels
- Pills position toggle (above/below carousels)
- Grid layouts: Artists, Genres, Radio, Playlists, Favorites, Folders
- Keyboard shortcuts toggle in Settings > Accessibility

### Changed
- Customize icon changed from chat to sliders

---

## [1.2.0] - 2026-04-01

### Added
- Last.fm integration: artist bios, tags, stats, similar artists
- Artist images via MusicBrainz + Wikidata + Wikimedia Commons
- Artist spotlight tab in desktop Now Playing (click vinyl to open)
- Browse similar artist bios inline
- New carousels: Starred Albums, Released This Year, Recently Played
- fanart.tv integration (later replaced by Wikimedia Commons)

### Fixed
- API key masking: dots after saving, password input, remove button

---

## [1.1.0] - 2026-03-31

### Added
- Desktop full-screen Now Playing: spinning vinyl, three-column layout
- Blurred album art background (Plex-style)
- Command palette (Ctrl+K / Cmd+K)
- Mini player: progress ring, spinning art, waveform bars, quick actions
- Accent color picker: 12 presets + custom hex
- Dominant color extraction for Now Playing background
- useMediaQuery hook
- Fuzzy search utility

### Fixed
- Volume desync between mobile and desktop
- Lyrics sync scrolling in desktop panel

---

## [1.0.1] - 2026-03-31

### Added
- Cloudflare Pages deployment
- Docker support with auto-publish to Docker Hub
- GitHub Actions CI/CD
- GitHub Issues templates (bug report, feature request)
- Share buttons on albums, artists, playlists
- Keyboard shortcuts (Space, arrows, M, S, R)
- Swipe to dismiss Now Playing on mobile
- Epilepsy warning for visualizer
- Music folder picker for multi-library servers
- Now playing session reporting to server

### Fixed
- Audio autoplay after async fetch (Random Mix)
- Browser lockup on rapid next track clicks
- Stale chunk crashes after deploy
- SubsonicClient not configured on page reload
- Next/previous works in repeat-one mode
- Folder browsing route parameter

---

## [1.0.0] - 2026-03-29

### Added
- Initial release
- Navidrome/Subsonic streaming
- Album, artist, genre, folder browsing
- Customizable library with reorderable shortcuts and carousels
- Queue management
- Shuffle, repeat, crossfade
- 10-band equalizer (Web Audio API)
- Visualizer: 6 WebGL shaders + Milkdrop (Butterchurn)
- Synced lyrics display
- Sleep timer, playback speed
- Dark and light themes
- PWA support with service worker
- Scrobbling
- Multi-server support
