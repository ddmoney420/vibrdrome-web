```
 __     __  ___   ____    ____    ____    ____     ___    __  __   _____
 \ \   / / |_ _| | __ )  |  _ \  |  _ \  |  _ \   / _ \  |  \/  | | ____|
  \ \ / /   | |  |  _ \  | |_) | | | | | | |_) | | | | | | |\/| | |  _|
   \ V /    | |  | |_) | |  _ <  | |_| | |  _ <  | |_| | | |  | | | |___
    \_/    |___| |____/  |_| \_\ |____/  |_| \_\  \___/  |_|  |_| |_____|
```

### ♪♫(◕‿◕)♫♪ *A modern web music player for Navidrome & Subsonic*

**[Try it live at web.vibrdrome.io](https://web.vibrdrome.io)**

![Vibrdrome Web](screenshot.png)

---

## ♪(๑ᴖ◡ᴖ๑)♪ Features

**Library & Browsing**
- Stream your full music library from any Navidrome/Subsonic server
- Album, artist, genre, and folder browsing
- Customizable library — reorder & show/hide shortcuts and carousels
- Playlist management and smart playlists
- Search across your entire collection

**Playback** ♪┏(・o･)┛♪
- Gapless queue with drag-to-reorder
- Shuffle, repeat (all/one), and crossfade
- 10-band equalizer powered by Web Audio API
- Playback speed control
- Sleep timer with fade-out
- Scrobbling support

**Visualizer** (ﾉ◕ヮ◕)ﾉ*:・゚
- 6 WebGL shader presets (Plasma, Kaleidoscope, Tunnel, Fractal Pulse, Nebula, Warp Speed)
- Milkdrop mode via Butterchurn
- Photosensitivity warning with accessibility controls

**Design**
- Responsive — works on desktop, tablet, and mobile
- Dark and light themes
- Offline-capable PWA
- Keyboard media key support
- Radio station support

---

## (ﾉ◕ヮ◕)ﾉ*:・゚ Getting Started

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

Output lands in `dist/` — deploy to any static host (Cloudflare Pages, Vercel, Netlify, etc.).

---

## Tech Stack

| Tech | What |
|------|------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite 8** | Build tool |
| **Tailwind CSS 4** | Styling |
| **Zustand** | State management |
| **Web Audio API** | EQ & visualizer |
| **Butterchurn** | Milkdrop visualizations |

---

## Other Vibrdrome Apps ヽ(>∀<)ノ

| Platform | Link |
|----------|------|
| iOS / macOS | [vibrdrome.io](https://vibrdrome.io) |
| Android | [vibrdrome.io](https://vibrdrome.io) |
| Web | [web.vibrdrome.io](https://web.vibrdrome.io) |

---

## (♥‿♥) Community

- **Website:** [vibrdrome.io](https://vibrdrome.io)
- **Discord:** [Join the server](https://discord.gg/9q5uw3CfN)
- **GitHub Issues:** [Report bugs or request features](https://github.com/ddmoney420/vibrdrome-web/issues)

---

## Contributing

Contributions are welcome! ♪♫(◕‿◕)♫♪

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch and open a PR

---

## License

[MIT](LICENSE)
