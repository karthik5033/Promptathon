# 🎮 Bit Odyssey — Super Mario-Style Platformer

> A stunning 2D side-scrolling platformer inspired by classic Super Mario, celebrating 80 years of computing history. Built with Next.js and HTML5 Canvas.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Overview

**Bit Odyssey** is a feature-rich, Super Mario-style 2D platformer that takes players on a journey through the evolution of computing — from the era of vacuum tubes to modern AI. Run, jump, and collect power-ups across dynamically generated levels, all rendered on an HTML5 Canvas with smooth 60fps gameplay.

## 🕹️ Gameplay

| Control | Action |
|---------|--------|
| `SPACE` / `▲` | Jump |
| `G` | Toggle Flying Mode |

### Core Mechanics
- **Side-scrolling platforming** — Classic Mario-style running and jumping
- **Dynamic obstacle generation** — Procedurally generated platforms and hazards
- **Collectible system** — Gather Data Bits 💎, Sky Shields 🛡️, and 2X Score Stars ⭐
- **Era progression** — Travel through computing history as you advance
- **Flying mode** — Activate with `G` for aerial gameplay
- **Leaderboard** — Compete for high scores

## 🏗️ Architecture

```
├── app/
│   ├── page.tsx              # Main menu screen
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── character/            # Character selection
│   ├── game/                 # Game page
│   └── leaderboard/          # Leaderboard page
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx     # Main game loop & canvas renderer
│   │   ├── Player.ts          # Player physics & state
│   │   ├── CharacterRenderer.ts # Character sprite rendering
│   │   ├── Obstacle.ts        # Obstacle generation & collision
│   │   ├── Platform.ts        # Platform mechanics
│   │   ├── Collectibles.ts    # Power-ups & collectible items
│   │   ├── BackgroundSystem.ts # Parallax background rendering
│   │   ├── ParticleSystem.ts  # Visual particle effects
│   │   ├── EraManager.ts      # Computing era progression
│   │   ├── Cloud.ts           # Cloud rendering
│   │   ├── IEEECoin.ts        # Special IEEE anniversary coins
│   │   ├── HUD.tsx            # Heads-up display overlay
│   │   ├── HintOverlay.tsx    # In-game hint system
│   │   └── LoreCard.tsx       # Computing history lore cards
│   └── ui/                    # Reusable UI components
└── public/
    └── music/                 # Game audio assets
```

## 🚀 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | App framework & routing |
| **React 19** | UI components & state management |
| **TypeScript 5** | Type-safe game logic |
| **HTML5 Canvas** | Game rendering engine |
| **Tailwind CSS 4** | UI styling |

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm / bun

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/bit-odyssey.git
cd bit-odyssey

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play the game.

### Production Build

```bash
npm run build
npm start
```

## 🎨 Features

- 🌌 **Dynamic backgrounds** with parallax scrolling and atmospheric effects
- 🏃 **Smooth character animations** with custom sprite rendering
- 💥 **Particle effects** for impacts, collections, and transitions
- 🎵 **Background music** and sound effects
- 📜 **Lore cards** teaching computing history as you play
- 🏆 **Leaderboard system** for competitive play
- 📱 **Responsive design** — plays on desktop and mobile
- ⚡ **60fps gameplay** with optimized canvas rendering

## 🎯 Game Elements

| Element | Description |
|---------|-------------|
| 💎 **Data Bits** | Primary collectible — earn points |
| 🛡️ **Sky Shield** | Temporary invincibility power-up |
| ⭐ **2X Score** | Double your score for a limited time |
| 🪙 **IEEE Coins** | Special anniversary bonus collectibles |

---

<p align="center">
  Built with ❤️ using Next.js, TypeScript & HTML5 Canvas
</p>
