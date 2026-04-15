# Contributing to Vibrdrome

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm (comes with Node)
- [Docker](https://www.docker.com/) (optional, for container builds)

### Setup

```bash
git clone https://github.com/ddmoney420/vibrdrome-web.git
cd vibrdrome-web
npm install
npm run dev        # starts dev server at http://localhost:5173
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check (tsc) + production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run preview` | Preview production build locally |

### Docker

Build and run the production image:

```bash
docker build -t vibrdrome-web .
docker run -p 8080:80 vibrdrome-web
```

The app will be available at `http://localhost:8080`. The image uses a multi-stage build (Node 20 → nginx:alpine) and serves the SPA with proper routing and gzip compression.

## Development Workflow

1. **Branch from `develop`:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature
   ```

2. **Make your changes.** Follow the existing code style — TypeScript strict mode is enabled.

3. **Before committing, run lint and tests:**
   ```bash
   npm run lint
   npm run test:run
   ```

4. **Open a PR targeting `develop`.** Fill out the PR template checklist.

5. Changes are merged to `develop` first, then promoted to `master` for release. Pushes to `master` trigger CI (Cloudflare Pages deploy + Docker Hub image).

## Architecture Overview

```
src/
├── api/          # SubsonicClient, LastFmClient, ArtistImageClient
├── audio/        # PlaybackManager (Web Audio API), usePlayback hook
├── components/   # Reusable UI (player, eq, visualizer, lyrics, etc.)
├── screens/      # Route-level page components
├── stores/       # Zustand state (playerStore, libraryStore, etc.)
├── hooks/        # Shared React hooks
├── utils/        # Helpers (color extraction, fuzzy search, sharing)
├── shaders/      # GLSL shader code for visualizer
├── types/        # TypeScript type definitions
└── assets/       # SVGs and images
```

**Key patterns:**
- State management via [Zustand](https://github.com/pmndrs/zustand) stores
- Audio playback through `PlaybackManager` using the Web Audio API
- Subsonic/OpenSubsonic API for server communication
- Tailwind CSS 4 for styling

## Code Style

- TypeScript strict mode — no `any` unless absolutely necessary
- React functional components with hooks
- ESLint enforces style rules — run `npm run lint` to check

## Testing

Tests live alongside source files as `*.test.ts` / `*.test.tsx`. We use:

- **Vitest** as the test runner
- **@testing-library/react** for component tests
- **happy-dom** as the DOM environment

Add tests for new utilities, stores, and non-trivial logic.

## Security Vulnerabilities

Please report vulnerabilities privately — see [SECURITY.md](SECURITY.md) for details.
