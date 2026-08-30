# 🎮 TinT - Bengali 3D Multi-Game Board Suite

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

**TinT** is a production-grade, tactile, 3-in-1 strategy board game suite crafted with modern web technologies, 3D physics tilt interactions, procedural Web Audio synthesis, authoritative real-time multiplayer, and offline IndexedDB persistence. Designed with a **Bengali-First** aesthetic and complete bilingual localization (English ⇄ বাংলা), it brings together three classic strategy games in an installable, high-performance Progressive Web App (PWA).

---

## 🕹️ Included Games

### 1. 3D Tic-Tac-Toe & Gomoku (টিক-ট্যাক-টো)
- **Classic 3×3 Grid**: Quick 3-in-a-row showdown with instant tactile feedback.
- **Medium 4×4 & 5×5 Boards**: 4-in-a-row tactical depth with larger strategic branching.
- **Grand 10×10 & 15×15 Gomoku Arenas**: 5-in-a-row continuous line battle with spatial candidate move pruning.
- **Customizable Dimensions**: Configure custom grid sizes from 3×3 to 15×15 and variable win lengths.

### 2. Dots & Boxes (খোপ খেলা / বিন্দু ও বক্স)
- **Classic Paper & Pen Strategy**: Connect adjacent dots with horizontal and vertical lines to capture square boxes.
- **Consecutive Turn Mechanism**: Completing a box grants an immediate bonus turn.
- **Configurable Grid Scales**: Play on 2×2 (3×3 dots), 3×3 (4×4 dots), 4×4 (5×5 dots), 5×5 (6×6 dots), and custom sizes up to 6×6 boxes (7×7 dots).
- **Tactical AI**: Evaluates safe non-capturing lines, avoids creating 3-sided trap boxes, and executes chain captures.

### 3. Connect Four (৪-মিলান / Four in a Row)
- **Gravity-Fed Vertical Rack**: Drop colored tokens into vertical columns with natural drop physics and bevel highlights.
- **Multi-Directional Win Detection**: Connect 4 pieces horizontally, vertically, or diagonally.
- **Rack Configurations**: Standard (7×6), Compact (6×5), Master (8×7), and custom boards (4–8 rows, 5–9 columns).
- **Interactive Column Previews**: Hover drop indicators and ghost tokens guide every drop before commitment.

---

## ✨ Key Features

- **🌐 Real-Time Authoritative Online Multiplayer**:
  - Authoritative backend state validation preventing illegal moves and race conditions.
  - Quick room creation with 5-character alphanumeric room codes (e.g., `8K2PM`).
  - Context-aware Web Share API and one-tap clipboard invitation link sharing.
  - Automatic reconnection with 75-second grace timers and timing-safe 24-byte bearer authentication tokens.
  - Floating live reaction emojis with sound and visual feedback.
  - Integrated rematch voting and room lifecycle management.

- **🤖 Smart Heuristic AI Engine**:
  - **Easy Tier**: Casual play with randomized exploratory moves.
  - **Medium Tier**: Defends against immediate threats and seizes winning lines.
  - **Hard Tier**: Minimax with Alpha-Beta pruning, spatial candidate filtering, and deep chain evaluations.

- **🇧🇩 Bilingual Localization (বাংলা ও English)**:
  - Complete Bengali typography support paired with *Hind Siliguri* / *Noto Serif Bengali* and *Outfit*.
  - Native Bengali numeral conversions (`১, ২, ৩, ...`).
  - One-tap instant language toggle across all views.

- **🎵 Procedural Web Audio Engine**:
  - 100% synthesized sound effects generated in real time using the browser's Web Audio API.
  - Zero external `.mp3` / `.wav` assets required — zero loading latency and full offline compatibility.
  - Dynamic procedural tones for moves, line placements, box completions, token drops, victories, and confetti bursts.

- **🎨 Player Customization & Interactive Cropper**:
  - 10 curated color themes (Coral, Blue, Purple, Emerald, Amber, Rose, Orange, Teal, Indigo, Cyan, Lime).
  - Built-in photo cropper with canvas manipulation, zoom, rotation, and pan controls.
  - Strict client- and server-side image MIME type verification (`image/jpeg`, `png`, `webp`, `gif`) and 150KB optimized payload storage.
  - 16 custom avatar symbols (Crown, Tiger, Trophy, Flame, Star, Sword, Shield, Zap, Robot, Diamond, Circle, Sparkles, Rocket, Heart, Gem, Controller).

- **🎬 Winning Move Replay & Celebrations**:
  - Step-by-step decisive move replay with animated highlighting.
  - Canvas-based confetti bursts, particle explosions, and winner banners.

- **🏆 Achievement & Stats System**:
  - Dual-layer storage (IndexedDB with automatic localStorage fallback).
  - Track total wins, current win streaks, high scores, and game-specific victories.
  - Unlockable badges (First Blood, Streak Master, Grandmaster, Chain King, Four Connect, etc.).

- **📱 Progressive Web App (PWA) & Security**:
  - Installable on Android, iOS, Windows, and macOS.
  - Service worker caching with automatic update prompts.
  - Hardened with Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, and socket-level rate limiting.

---

## 🛠️ Architecture & Tech Stack

```
tint-board-game/
├── public/                  # PWA Manifest, Service Worker & Vector Icons
├── server.ts                # Express HTTP + Socket.IO Authoritative Game Server
├── src/
│   ├── components/          # Modular React Components
│   │   ├── ConnectFourBoard.tsx          # Vertical gravity rack renderer
│   │   ├── ConnectFourBoardSelection.tsx # C4 grid presets and customizer
│   │   ├── DotsGameBoard.tsx             # SVG coordinate grid with interactive lines
│   │   ├── DotsBoardSelection.tsx        # Dots & Boxes presets
│   │   ├── GameBoard.tsx                 # 3D Neo-brutalist Tic-Tac-Toe board
│   │   ├── BoardSelection.tsx            # Tic-Tac-Toe / Gomoku board presets
│   │   ├── OnlineLobby.tsx               # Multiplayer room manager & invite link generator
│   │   ├── OnlineReactions.tsx           # Floating real-time emoji reaction system
│   │   ├── GameResultModal.tsx           # Game conclusion dialog with replay controls
│   │   ├── LocalSetupModal.tsx           # Local 2-Player name and avatar configuration
│   │   ├── PlayerCustomizer.tsx          # Player profile, avatar, and color customizer
│   │   ├── ImageCropperModal.tsx         # Interactive pan/zoom/rotate image cropper
│   │   ├── SettingsModal.tsx             # Sound, haptics, tilt, and language settings
│   │   └── ...
│   ├── engine/              # Pure Core Logic & Authoritative Mathematical Models
│   │   ├── aiEngine.ts                   # Minimax, Alpha-Beta pruning & heuristics
│   │   ├── dotsAiEngine.ts               # Chain and box valuation heuristics
│   │   ├── connectFourEngine.ts          # Gravity drop & multi-directional line detector
│   │   ├── dotsEngine.ts                 # Topological grid state & box completion engine
│   │   ├── gameEngine.ts                 # Tic-Tac-Toe / Gomoku win verification
│   │   ├── soundEngine.ts                # Web Audio API procedural synthesizer
│   │   ├── hapticsEngine.ts              # Mobile vibration feedback controller
│   │   ├── multiplayerEngine.ts          # Socket.IO client interface & state sync
│   │   ├── indexedDb.ts                  # Persistent structured database storage
│   │   └── storage.ts                    # Local persistence & settings store
│   ├── i18n/                # Localization Dictionaries (English & Bengali)
│   ├── constants/           # Color Schemes, Avatars, Themes, and Board Presets
│   ├── types.ts             # Strict TypeScript Type Definitions
│   ├── App.tsx              # Root Application Coordinator & Navigation Hub
│   └── main.tsx             # DOM Root Entry Point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/tint-board-game.git
   cd tint-board-game
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Run the production server:**
   ```bash
   npm start
   ```

---

## 🎮 How to Play

### Tic-Tac-Toe / Gomoku
- Select your board dimensions (3×3 up to 15×15).
- Players take turns placing marks on unoccupied squares.
- The first player to align the target number of consecutive symbols horizontally, vertically, or diagonally wins the match.

### Dots & Boxes
- Players take turns clicking or tapping uncolored line segments between adjacent grid dots.
- Whenever a line closes the 4th side of a square box, that box is claimed with the player's color, and the player gets an **extra turn**.
- The player with the highest number of claimed boxes when the grid is full wins.

### Connect Four
- Players take turns dropping tokens into any non-full vertical column.
- The token automatically drops to the lowest unoccupied slot in that column.
- The first player to connect 4 adjacent tokens in a straight row wins.

---

## ⚙️ Configuration & Customization

| Feature | Options |
|---|---|
| **Game Modes** | Local 2-Player (Same Device), AI Opponent (3 Difficulties), Online 2-Player (Real-Time) |
| **Audio Volume** | 0% to 100% with independent procedural synthesizer toggles |
| **Haptic Feedback** | Subtle vibration feedback patterns on supported mobile devices |
| **3D Tilt Effects** | Interactive perspective distortion following cursor and touch movement |
| **Reduced Motion** | Accessibility toggle to disable intense animations and particle effects |
| **Player Customization** | 10 Color palettes, 16 custom avatar icons, and photo upload with interactive cropper |
| **Board Presets** | Multiple board scales and custom dimension builders across all three games |
| **Languages** | Bengali (`বাংলা`) / English (`EN`) with full numeral localization |

---

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).
