# CAN YOU BEAT JEV? 🤖⚡
> **Human vs AI. One game at a time.**

A polished, production-quality web gaming platform where humans test their tactical wit directly against **Jev**, TypeSafe's System One decision model.

---

## 🎮 The Core Experience

1. **Open website**: Land immediately on the AI Arena with live species battle statistics.
2. **Understand the challenge**: Fast, high-stakes tactical micro-games (45–90 seconds).
3. **Pick a game**: Choose from 5 distinct tactical duels.
4. **Play instantly**: Responsive, zero-latency interactions with real-time AI decision telemetry.
5. **Real Jev Opponent**: Watch Jev evaluate probability distributions, confidence meters, latency, and witty reactive taunts.
6. **Share your result**: Copy formatted Wordle-style battle cards with your streak to challenge friends.
7. **Climb the leaderboard**: Build consecutive win streaks and defend humanity on the global scoreboard.

---

## 🕹️ Included Games

All games implement a uniform, decoupled `Game<TState, TAction>` interface:

| Game | Tagline | Difficulty | Time | Human Win Rate |
|---|---|---|---|---|
| **Tic-Tac-Toe** | *Outsmart Jev in the classic game* | Casual | ~45s | 31% |
| **Minesweeper** | *Find safe zones before Jev finds the winning strategy* | Tactical | ~1.5m | 27% |
| **Glass Stepping Stones** | *Cross the suspended glass abyss before Jev* | Hardcore | ~1m | 34% |

---

## 🧠 Jev's Opponent Persona & Telemetry

Jev is an active, vocal AI opponent powered by **TypeSafe's System One model** (`jev-1.13.0` / `jev-latest`):
- **Dynamic Avatar Expressions**: Smug, Calculating, Sweating, Glitching, Evil Laugh, Confident.
- **Interactive Personality**: Click/poke Jev anywhere on the site to trigger reactive voice lines.
- **Live Decision Telemetry HUD**: Displays inference latency (ms), decision confidence (0–100%), and top evaluated action probability distributions ($P(\text{Action})$).
- **Audio Soundscape**: Synthesized 8-bit / cyber Web Audio API sound effects for moves, win fanfares, defeat glitches, and streak flames (with a 1-click mute toggle).

---

## 🔒 Security Architecture

- **Backend API Layer**: Built with **FastAPI** (`main.py`).
- **No Client-Side Secrets**: `TYPESAFE_API_KEY` is strictly confined to `.env` on the server.
- **Resilient Fallback Engine**: If network or external API limits occur, internal heuristic solvers seamlessly back up the decisions so the user experience never freezes or crashes.

---

## 🚀 Quickstart

### 1. Requirements
- Python 3.12+ with `uv`
- Node.js 18+ and `npm`

### 2. Run the Full-Stack Application
The FastAPI backend serves both the `/api/*` endpoints and the optimized production frontend build:

```bash
# Build the React frontend
npm run build --prefix frontend

# Launch the production server
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```
Open **`http://localhost:8000`** in your browser.

### 3. Development Mode
For hot-module replacement during frontend development:

```bash
# Terminal 1: Backend
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Vite Dev Server (proxies /api to 8000)
cd frontend
npm run dev
```
Open **`http://localhost:5173`**.

---

## 🧩 Adding a New Game

Adding new games is modular and decoupled from the UI.

1. Create a folder in `frontend/src/games/<your-game>/index.tsx`.
2. Implement the `Game<TState, TAction>` interface:
```typescript
export interface Game<TState, TAction> {
  id: string;
  name: string;
  tagline: string;
  description: string;
  difficulty: 'Casual' | 'Tactical' | 'Hardcore';
  estimatedTime: string;
  iconName: string;
  humanWinRate: string;
  colorAccent: string;

  initialize(options?: any): TState;
  getValidActions(state: TState): TAction[];
  applyAction(state: TState, action: TAction, player: 'human' | 'jev'): TState;
  isFinished(state: TState): boolean;
  getResult(state: TState): GameResult;
  formatStateForJev(state: TState): {
    game_state: Record<string, any>;
    valid_actions: any[];
    instructions?: string;
  };
  renderBoard(props: {
    state: TState;
    onPlayerAction: (action: TAction) => void;
    isHumanTurn: boolean;
    isThinking: boolean;
    lastJevDecision: JevDecision | null;
  }): React.ReactNode;
}
```
3. Register the new game in `frontend/src/games/registry.ts`:
```typescript
import { yourNewGame } from './your-game';
export const ALL_GAMES: Game[] = [..., yourNewGame];
```
The game will automatically appear on the landing page, leaderboard, and game runner with full Jev telemetry and shareable results!
