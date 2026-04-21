# Vibrdrome Web — Claude Code Instructions

## Project Overview

Self-hosted web music player for Navidrome/Subsonic servers.
React 19 + TypeScript + Vite + Zustand + Web Audio API + Tailwind CSS 4.

## Versioning

- All versions use `-beta.N` suffix until official v1.0.0 launch (e.g., `1.8.1-beta.1`)
- Increment patch for bugfixes, minor for new capabilities, beta number for iterations
- **Never bump versions without explicit user approval**

## Git Workflow

- `master` — production branch, triggers deploy (Cloudflare Pages + Docker Hub)
- `develop` — integration branch, all work goes here first
- Feature branches from `develop`, PRs to `develop`
- **Never push to any remote branch without explicit user approval**
- **Never merge to master without user approval**
- Commits use `[skip ci]` on `develop` to avoid wasting CI runs

## SDLC Checklist — REQUIRED Before Every Push to Master

This is mandatory. Do not skip any step.

### 1. Code Quality
```bash
npm run lint        # Must be clean (zero warnings)
npm run test:run    # All tests must pass
npm run build       # Must succeed
```

### 2. Docker Verification
```bash
docker build -t vibrdrome-web .
docker run -p 8080:80 vibrdrome-web
# Verify: container starts, health check passes, security headers present
```

### 3. Documentation Updates
- [ ] `CHANGELOG.md` — Add version entry with all changes (Added/Fixed/Changed sections)
- [ ] `README.md` — Update if features or behavior changed
- [ ] `package.json` — Version bumped with `-beta.N` suffix
- [ ] `src/screens/SettingsScreen.tsx` — About version string matches package.json

### 4. Commit and PR
- Commit docs/version bump to `develop`
- Create PR from `develop` to `master` via `gh pr create`
- PR body must include summary of changes and test plan

### 5. Merge and Tag
- Merge PR (only after user approval)
- Tag release: `git tag v{version}` and push tag (triggers GitHub Release workflow)

## Code Conventions

- TypeScript strict mode — no `any` unless absolutely necessary
- React functional components with hooks
- State management via Zustand stores with localStorage persistence
- Audio playback through PlaybackManager singleton using Web Audio API
- Subsonic/OpenSubsonic API via SubsonicClient singleton
- Tests co-located as `*.test.ts` / `*.test.tsx` using Vitest + happy-dom
- ESLint enforces style — `npm run lint` must be clean
- Tailwind CSS 4 for styling, theme via CSS custom properties

## Key Architecture

```
src/
├── api/          # SubsonicClient (singleton), LastFmClient, ArtistImageClient
├── audio/        # PlaybackManager (singleton), CastManager, DownloadManager, usePlayback hook
├── components/   # Reusable UI (player, eq, visualizer, lyrics, etc.)
├── screens/      # Route-level page components (lazy-loaded)
├── stores/       # Zustand state (playerStore, uiStore, eqStore, authStore, etc.)
├── hooks/        # Shared React hooks
├── utils/        # Helpers (color, fuzzySearch, share, settingsIO, queueSync)
├── types/        # TypeScript type definitions (subsonic.ts)
└── assets/       # SVGs and images
```

## Important Patterns

- **Don't add features beyond what was asked.** No speculative abstractions.
- **Read files before modifying them.** Understand existing code first.
- **Don't push without approval.** Propose changes, wait for confirmation.
- **Flag deferred features** so the user can decide priority.
- **Settings follow the existing pattern** — localStorage key, loadBool/IIFE loader, setter with persist.
- **API methods follow SubsonicClient patterns** — `request()` for single params, `requestMultiValue()` for arrays.
- **Queue sync is opt-in** — controlled by `queueSyncEnabled` in uiStore.
