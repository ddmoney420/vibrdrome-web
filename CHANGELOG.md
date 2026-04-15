# Changelog

All notable changes to Vibrdrome Web are documented here.

## [Unreleased]
- Document Picture-in-Picture support (Chrome native PiP window)

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
