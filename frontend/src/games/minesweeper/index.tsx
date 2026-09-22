import React from 'react';
import { motion } from 'framer-motion';
import { Bomb, ShieldCheck, AlertOctagon, Sparkles, CheckCircle2 } from 'lucide-react';
import { Game, GameResult } from '../../types/game';
import { sound } from '../../services/sound';

export interface MinesweeperState {
  size: number;
  mines: number[];
  revealed: Record<number, number>; // index -> adjacent mine count
  detonatedCell: number | null;
  detonatedBy: 'human' | 'jev' | null;
  turn: 'human' | 'jev';
  score: {
    human: number; // safe sectors swept
    jev: number;
  };
  movesCount: number;
  winner: 'human' | 'jev' | 'draw' | null;
  lastEvent: string;
  gameOver: boolean;
}

const GRID_SIZE = 5;
const NUM_MINES = 4;

function generateMines(totalCells: number, count: number): number[] {
  const indices: number[] = [];
  while (indices.length < count) {
    const r = Math.floor(Math.random() * totalCells);
    if (!indices.includes(r)) {
      indices.push(r);
    }
  }
  return indices;
}

function getAdjacentMines(cellIndex: number, mines: number[], size: number): number {
  const row = Math.floor(cellIndex / size);
  const col = cellIndex % size;
  let count = 0;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        const neighborIdx = nr * size + nc;
        if (mines.includes(neighborIdx)) {
          count++;
        }
      }
    }
  }
  return count;
}

export const minesweeperGame: Game<MinesweeperState, number> = {
  id: 'minesweeper',
  name: 'Minesweeper',
  tagline: 'Sudden-death minefield duel against Jev',
  description: 'Take turns sweeping a 5x5 minefield with 4 hidden mines. Find safe sectors to score points. If you or Jev uncover a mine, that player detonates instantly and LOSES.',
  difficulty: 'Tactical',
  estimatedTime: '~1 min',
  iconName: 'ShieldAlert',
  colorAccent: '#FF3366',

  initialize(): MinesweeperState {
    const total = GRID_SIZE * GRID_SIZE;
    const mines = generateMines(total, NUM_MINES);
    return {
      size: GRID_SIZE,
      mines,
      revealed: {},
      detonatedCell: null,
      detonatedBy: null,
      turn: 'human',
      score: { human: 0, jev: 0 },
      movesCount: 0,
      winner: null,
      lastEvent: 'Take turns uncovering sectors. 4 mines hidden in the field. Detonation = instant loss!',
      gameOver: false,
    };
  },

  getValidActions(state: MinesweeperState): number[] {
    if (state.gameOver) return [];
    const valid: number[] = [];
    const total = state.size * state.size;
    for (let i = 0; i < total; i++) {
      if (state.revealed[i] === undefined && state.detonatedCell !== i) {
        valid.push(i);
      }
    }
    return valid;
  },

  applyAction(state: MinesweeperState, action: number, player: 'human' | 'jev'): MinesweeperState {
    const cell = Number(action);
    const totalCells = state.size * state.size;

    if (
      state.gameOver ||
      !Number.isInteger(cell) ||
      cell < 0 ||
      cell >= totalCells ||
      state.revealed[cell] !== undefined ||
      state.detonatedCell === cell
    ) {
      return state;
    }

    const isMine = state.mines.includes(cell);

    if (isMine) {
      // INSTANT DETONATION: Player who clicked the mine loses! Other player wins!
      const winner = player === 'human' ? 'jev' : 'human';
      const eventText = player === 'human'
        ? `💥 BOOM! You triggered a hidden mine at Sector ${cell}. Jev wins because detonation is an instant loss.`
        : `🏆 DETONATION! Jev triggered a hidden mine at Sector ${cell}. You win because Jev detonated.`;

      return {
        ...state,
        detonatedCell: cell,
        detonatedBy: player,
        winner,
        gameOver: true,
        movesCount: state.movesCount + 1,
        lastEvent: eventText,
      };
    } else {
      // Safe cell uncovered
      const adj = getAdjacentMines(cell, state.mines, state.size);
      const newRevealed = { ...state.revealed, [cell]: adj };

      const newScore = {
        human: state.score.human + (player === 'human' ? 1 : 0),
        jev: state.score.jev + (player === 'jev' ? 1 : 0),
      };

      const totalSafe = state.size * state.size - NUM_MINES;
      const allSafeCleared = Object.keys(newRevealed).length >= totalSafe;

      let winner: 'human' | 'jev' | 'draw' | null = null;
      let gameOver = false;
      let eventText = `${player === 'human' ? 'You' : 'Jev'} swept safe Sector ${cell} (${adj} adjacent mines).`;

      if (allSafeCleared) {
        gameOver = true;
        if (newScore.human > newScore.jev) winner = 'human';
        else if (newScore.jev > newScore.human) winner = 'jev';
        else winner = 'draw';
        eventText = `All safe sectors cleared! Final score: Human ${newScore.human} - Jev ${newScore.jev}.`;
      }

      return {
        ...state,
        revealed: newRevealed,
        turn: player === 'human' ? 'jev' : 'human',
        score: newScore,
        movesCount: state.movesCount + 1,
        winner,
        gameOver,
        lastEvent: eventText,
      };
    }
  },

  isFinished(state: MinesweeperState): boolean {
    return state.gameOver;
  },

  getResult(state: MinesweeperState): GameResult {
    let reason = "Minefield sweep finished.";
    if (state.detonatedCell !== null) {
      if (state.detonatedBy === 'human') {
        reason = `💥 Sudden Death: You uncovered a hidden mine at Sector ${state.detonatedCell}. Jev wins!`;
      } else {
        reason = `🏆 Jev Detonated: Jev miscalculated safe odds and triggered a mine at Sector ${state.detonatedCell}. You win!`;
      }
    } else if (state.winner === 'human') {
      reason = `Sector Cleared! You out-swept Jev by finding ${state.score.human} safe sectors vs Jev's ${state.score.jev}.`;
    } else if (state.winner === 'jev') {
      reason = `Sector Cleared! Jev found ${state.score.jev} safe sectors vs your ${state.score.human}.`;
    } else if (state.winner === 'draw') {
      reason = `Equal sweep! Both found ${state.score.human} safe sectors.`;
    }

    return {
      finished: state.gameOver,
      winner: state.winner,
      reason,
      score: state.score,
      movesCount: state.movesCount,
    };
  },

  formatStateForJev(state: MinesweeperState) {
    const valid = this.getValidActions(state);
    return {
      game_state: {
        game: 'minesweeper',
        grid_size: state.size,
        revealed_tiles: state.revealed,
        unrevealed_tiles: valid,
        mines_count: NUM_MINES,
      },
      valid_actions: valid,
      instructions:
        'You are Jev competing in Minesweeper Duel. If you pick a mine, you explode and lose immediately. Choose the single unrevealed sector that is most statistically likely to be SAFE.',
    };
  },

  renderBoard({ state, onPlayerAction, isHumanTurn, isThinking }) {
    const isClickable = isHumanTurn && !isThinking && !state.gameOver;
    const totalCells = state.size * state.size;

    return (
      <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-md mx-auto w-full">
        {/* Score Board */}
        <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-jev-surface border border-jev-border mb-4 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-jev-cyan" />
            <span className="text-slate-300">You:</span>
            <span className="text-jev-cyan font-bold text-lg">{state.score.human} safe</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
            <Bomb className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="text-red-400">4 MINES (SUDDEN DEATH)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-jev-pink font-bold text-lg">{state.score.jev} safe</span>
            <span className="text-slate-300">:Jev</span>
            <span className="w-2.5 h-2.5 rounded-full bg-jev-pink" />
          </div>
        </div>

        {/* 5x5 Mine Grid */}
        <div className="p-3 rounded-3xl bg-jev-surface border-2 border-jev-border shadow-2xl relative">
          <div className="grid grid-cols-5 gap-2 w-72 h-72 sm:w-80 sm:h-80">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const isRevealed = state.revealed[idx] !== undefined;
              const isMine = state.mines.includes(idx);
              const isDetonated = state.detonatedCell === idx;
              const showMine = state.gameOver && isMine;
              const adjCount = state.revealed[idx];

              return (
                <motion.button
                  key={idx}
                  whileHover={!isRevealed && !state.gameOver && isClickable ? { scale: 1.08 } : {}}
                  whileTap={!isRevealed && !state.gameOver && isClickable ? { scale: 0.92 } : {}}
                  onClick={() => {
                    if (!isRevealed && isClickable) {
                      sound.playMove();
                      onPlayerAction(idx);
                    }
                  }}
                  disabled={isRevealed || state.gameOver || !isClickable}
                  className={`rounded-xl flex items-center justify-center font-mono font-bold text-sm sm:text-base transition-all relative border ${
                    isDetonated
                      ? 'bg-red-600 border-red-400 text-white shadow-glow-red animate-pulse'
                      : showMine
                      ? 'bg-red-950/80 border-red-600/70 text-red-400'
                      : isRevealed
                      ? 'bg-slate-900/90 border-slate-700/60'
                      : isClickable
                      ? 'bg-jev-card hover:bg-slate-800 border-jev-border hover:border-jev-cyan cursor-pointer group shadow-sm'
                      : 'bg-jev-card/40 border-jev-border/40 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isDetonated ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="flex flex-col items-center justify-center"
                    >
                      <Bomb className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : showMine ? (
                    <Bomb className="w-4 h-4 text-red-400" />
                  ) : isRevealed ? (
                    <span
                      className={`font-black ${
                        adjCount === 0
                          ? 'text-slate-600 text-xs'
                          : adjCount === 1
                          ? 'text-jev-cyan'
                          : adjCount === 2
                          ? 'text-jev-green'
                          : adjCount === 3
                          ? 'text-jev-amber'
                          : 'text-red-400'
                      }`}
                    >
                      {adjCount === 0 ? '·' : adjCount}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-mono select-none group-hover:text-slate-400">
                      {idx}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Clear Outcome Banner */}
        <div
          className={`mt-4 font-mono text-xs text-center px-4 py-2.5 rounded-2xl max-w-sm w-full border ${
            state.detonatedCell !== null
              ? state.detonatedBy === 'human'
                ? 'bg-red-950/80 border-red-600 text-red-200'
                : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : state.gameOver
              ? 'bg-slate-900 border-jev-cyan text-white'
              : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}
        >
          {state.gameOver ? (
            <div>
              <div className="font-bold text-sm mb-0.5">
                {state.detonatedBy === 'human'
                  ? 'JEV WINS: YOU HIT A MINE'
                  : state.detonatedBy === 'jev'
                  ? 'YOU WIN: JEV HIT A MINE'
                  : state.winner === 'human'
                  ? 'YOU WIN: MORE SAFE SECTORS'
                  : state.winner === 'jev'
                  ? 'JEV WINS: MORE SAFE SECTORS'
                  : 'DRAW: MINEFIELD FULLY CLEARED'}
              </div>
              <div className="text-[11px] opacity-90">{state.lastEvent}</div>
            </div>
          ) : isThinking ? (
            <span className="text-jev-pink animate-pulse">Jev analyzing safe cell probabilities...</span>
          ) : isHumanTurn ? (
            <span className="text-jev-cyan animate-pulse">Your turn — Click any unrevealed sector</span>
          ) : (
            <span className="text-slate-400">Jev preparing move...</span>
          )}
        </div>
      </div>
    );
  },
};
