# 🎮 TinT - Bengali 3D Multi-Game Board Suite

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

**TinT** is an interactive, tactile, 3-in-1 strategy board game suite crafted with modern web technologies, 3D physics tilt effects, procedural audio synthesis, and real-time multiplayer. Designed with a **Bengali-First** aesthetic and complete bilingual localization (English ⇄ বাংলা), it brings together three classic strategy games in an installable Progressive Web App (PWA).

---

## 🕹️ Included Games

### 1. 3D Tic-Tac-Toe & Gomoku (টিক-ট্যাক-টো)
- **Classic 3×3 Grid**: Fast 3-in-a-row showdown with instant tactile feedback.
- **Medium 4×4 & 5×5 Boards**: 4-in-a-row tactical depth with larger decision trees.
- **Grand 10×10 & 15×15 Gomoku Arenas**: 5-in-a-row continuous line battle with candidate move pruning.
- **Customizable Dimensions**: Configure custom grid sizes from 3×3 to 15×15 and variable win lengths.

### 2. Dots & Boxes (খোপ খেলা / বিন্দু ও বক্স)
- **Classic Paper & Pen Strategy**: Connect adjacent dots with horizontal and vertical lines to capture square boxes.
- **Consecutive Turn Mechanism**: Completing a box grants an immediate bonus turn.
- **Configurable Grid Scales**: Play on 2×2 (3×3 dots), 3×3 (4×4 dots), 4×4 (5×5 dots), and 5×5 (6×6 dots).
- **Tactical AI**: Evaluates safe non-capturing lines, avoids creating 3-sided trap boxes, and executes chain captures.

### 3. Connect Four (৪-মিলান / Four in a Row)
- **Gravity-Fed Vertical Rack**: Drop colored tokens into vertical columns with natural physics and bevel highlights.
- **Multi-Directional Win Detection**: Connect 4 pieces horizontally, vertically, or diagonally.
- **Rack Configurations**: Standard (7×6), Compact (6×5), and Grand Master (8×7) boards.
- **Interactive Column Previews**: Hover arrows and ghost tokens guide every drop before commitment.

---

## ✨ Key Features

- **🌐 Real-Time Online Multiplayer**:
  - Room creation with 5-character alphanumeric room codes.
  - One-click invite link sharing (Web Share API & clipboard sync).
  - Low-latency bidirectional WebSocket synchronization powered by Socket.IO.
  - Floating live reaction emojis with sound and visual feedback.
  - Automatic disconnection alerts and seamless rematch negotiation.

- **🤖 Smart Heuristic AI Engine**:
  - **Easy Tier**: Casual play with randomized exploratory moves.
  - **Medium Tier**: Defends against immediate threats and seizes winning lines.
  - **Hard Tier**: Minimax with Alpha-Beta pruning, spatial candidate filtering, and deep chain evaluations.

- **🇧🇩 Bilingual Localization (বাংলা ও English)**:
  - Complete Bengali typography support paired with *Noto Serif Bengali* and *Outfit*.
  - Native Bengali numeral conversions (`১, ২, ৩, ...`).
  - One-tap instant language toggle across all views.

- **🎵 Procedural Web Audio Engine**:
  - 100% synthesized sound effects generated in real time using the browser's Web Audio API.
  - Zero external `.mp3` / `.wav` assets required — zero loading latency and full offline compatibility.
  - Unique tone frequencies for moves, box completions, token drops, victories, and confetti bursts.

- **🎨 Custom Avatars & Theme Engine**:
  - 8 distinct player themes (Coral, Sapphire, Emerald, Gold, Rose, Indigo, Lavender, Slate).
  - Built-in photo cropper to upload and frame custom player profile pictures.
  - 10 custom avatar symbols (Crown, Tiger, Trophy, Flame, Star, Sword, Shield, Zap, Robot, Diamond).

- **🎬 Winning Move Replay**:
  - Replay the decisive winning move on demand with animated highlighting and celebratory effects.

- **🏆 Achievement & Stats System**:
  - Track total wins, current win streaks, high scores, and game-specific victories.
  - Unlockable badges (First Blood, Streak Master, Grandmaster, Chain King, Four Connect, etc.).
  - Persistent state saved safely to `localStorage`.

- **📱 Progressive Web App (PWA)**:
  - Installable on Android, iOS, Windows, and macOS.
  - Service worker caching for fast offline play anywhere.

---

## 🛠️ Architecture & Tech Stack

```
tint-board-game/
├── public/                  # PWA Manifest, Service Worker & Vector Icons
├── server.ts                # Express HTTP + Socket.IO Real-time WebSocket Server
├── src/
│   ├── components/          # Modular React Components
│   │   ├── ConnectFourBoard.tsx      # Vertical gravity rack renderer
│   │   ├── DotsGameBoard.tsx         # SVG precision coordinate grid
│   │   ├── GameBoard.tsx             # 3D Neo-brutalist Tic-Tac-Toe board
│   │   ├── OnlineLobby.tsx           # Room codes & multiplayer lobby
│   │   ├── OnlineReactions.tsx       # Real-time floating emoji bar
│   │   ├── GameResultModal.tsx       # Win/Draw overlay with replay controls
│   │   ├── PlayerCustomizer.tsx      # Avatar & theme configuration
│   │   ├── SettingsModal.tsx         # Audio, haptics & visual preferences
│   │   └── ...
│   ├── engine/              # Pure Core Logic & Mathematics
│   │   ├── aiEngine.ts               # Minimax & Alpha-Beta pruning
│   │   ├── dotsAiEngine.ts           # Chain & box evaluation heuristics
│   │   ├── connectFourEngine.ts      # Gravity drop & diagonal line detector
│   │   ├── dotsEngine.ts             # Topological grid state & box completion
│   │   ├── soundEngine.ts            # Web Audio API procedural synthesizer
│   │   ├── hapticsEngine.ts          # Vibration feedback controller
│   │   ├── multiplayerEngine.ts      # Socket.IO client interface
│   │   └── storage.ts                # Local persistence & settings store
│   ├── i18n/                # Localization Dictionaries (English & Bengali)
│   ├── constants/           # Color Schemes, Avatars, and Board Presets
│   ├── types.ts             # Strict TypeScript Type Definitions
│   ├── App.tsx              # Root Application Coordinator
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
| **Audio Volume** | 0% to 100% with independent procedural synth toggles |
| **Haptic Feedback** | Subtle vibration feedback on mobile devices |
| **3D Tilt Effects** | Interactive perspective distortion following cursor and touch movement |
| **Reduced Motion** | Accessibility toggle to disable intense animations |
| **Token Color Palettes** | Select from curated color combinations (Classic Neo, Emerald & Gold, Sunset Blaze, Cyber Neon, Ruby & Sapphire, Ocean & Sunrise) with dynamic real-time player updates |
| **Dots Grid Themes** | Custom peg and line colors for enhanced contrast |
| **Languages** | Bengali (`বাংলা`) / English (`EN`) |

---

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).
