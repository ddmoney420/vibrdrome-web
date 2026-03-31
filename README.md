# Vibrdrome Web

A modern web-based music player for [Navidrome](https://www.navidrome.org/) and Subsonic-compatible servers. Built with React, TypeScript, and Tailwind CSS.

**[Try it live at web.vibrdrome.io](https://web.vibrdrome.io)**

## Features

- Stream your music library from any Navidrome/Subsonic server
- Customizable library with reorderable shortcuts and carousels
- Album, artist, genre, and folder browsing
- Queue management with drag-to-reorder
- Shuffle, repeat, and crossfade playback
- 10-band equalizer with Web Audio API
- Visualizer with WebGL shaders and Milkdrop (Butterchurn) modes
- Lyrics display
- Sleep timer and playback speed control
- Playlist management and smart playlists
- Radio station support
- Offline-capable PWA with service worker
- Responsive design for desktop and mobile
- Dark and light themes
- Keyboard media key support
- Scrobbling support

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A running [Navidrome](https://www.navidrome.org/) or Subsonic-compatible server

### Install and Run

```bash
git clone https://github.com/ddmoney420/vibrdrome-web.git
cd vibrdrome-web
npm install
npm run dev
```

Open `http://localhost:5173` and enter your server URL and credentials.

### Build for Production

```bash
npm run build
```

The output is in the `dist/` folder — deploy it to any static hosting provider.

## Tech Stack

- **React 19** with TypeScript
- **Vite 8** for builds
- **Tailwind CSS 4** for styling
- **Zustand** for state management
- **Web Audio API** for EQ and visualizer
- **Butterchurn** for Milkdrop visualizations

## Other Vibrdrome Apps

- [iOS / macOS](https://vibrdrome.io)
- [Android](https://vibrdrome.io)

## Community

- **Website:** [vibrdrome.io](https://vibrdrome.io)
- **Discord:** [Join the server](https://discord.gg/9q5uw3CfN)
- **GitHub Issues:** [Report bugs or request features](https://github.com/ddmoney420/vibrdrome-web/issues)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch and open a PR

## License

[MIT](LICENSE)
