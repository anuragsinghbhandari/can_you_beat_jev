import React from 'react';
import { motion } from 'framer-motion';
import { Game, GameResult } from '../../types/game';
import { sound } from '../../services/sound';

export interface TicTacToeState {
  board: string[]; // 9 cells: "" | "X" | "O"
  turn: 'human' | 'jev';
  movesCount: number;
  winner: 'human' | 'jev' | 'draw' | null;
  winningLine: number[] | null;
  lastMoveIndex: number | null;
}

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6]             // diags
];

const POSITION_LABELS: Record<number, string> = {
  0: 'Top-Left',
  1: 'Top-Center',
  2: 'Top-Right',
  3: 'Mid-Left',
  4: 'Center',
  5: 'Mid-Right',
  6: 'Bot-Left',
  7: 'Bot-Center',
  8: 'Bot-Right',
};

function checkWinner(board: string[]): { winner: 'human' | 'jev' | 'draw' | null; line: number[] | null } {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] === 'X' ? 'human' : 'jev', line: combo };
    }
  }
  if (board.every(cell => cell !== "")) {
    return { winner: 'draw', line: null };
  }
  return { winner: null, line: null };
}

export const ticTacToeGame: Game<TicTacToeState, number> = {
  id: 'tic-tac-toe',
  name: 'Tic-Tac-Toe',
  tagline: 'Outsmart Jev in the classic game',
  description: 'Can you defeat TypeSafe System One in a 3x3 tactical battle? Jev calculates the optimal counter-move in milliseconds.',
  difficulty: 'Casual',
  estimatedTime: '~45 sec',
  iconName: 'Grid',
  colorAccent: '#00F0FF',

  initialize(): TicTacToeState {
    return {
      board: Array(9).fill(''),
      turn: 'human',
      movesCount: 0,
      winner: null,
      winningLine: null,
      lastMoveIndex: null,
    };
  },

  getValidActions(state: TicTacToeState): number[] {
    if (state.winner) return [];
    return state.board
      .map((val, idx) => (val === '' ? idx : -1))
      .filter(idx => idx !== -1);
  },

  applyAction(state: TicTacToeState, action: number | string, player: 'human' | 'jev'): TicTacToeState {
    const idx = typeof action === 'string' ? parseInt(action, 10) : action;
    if (isNaN(idx) || idx < 0 || idx > 8 || state.board[idx] !== '' || state.winner) {
      return state;
    }

    const newBoard = [...state.board];
    newBoard[idx] = player === 'human' ? 'X' : 'O';

    const check = checkWinner(newBoard);

    return {
      board: newBoard,
      turn: player === 'human' ? 'jev' : 'human',
      movesCount: state.movesCount + 1,
      winner: check.winner,
      winningLine: check.line,
      lastMoveIndex: idx,
    };
  },

  isFinished(state: TicTacToeState): boolean {
    return state.winner !== null;
  },

  getResult(state: TicTacToeState): GameResult {
    const check = checkWinner(state.board);
    let reason = "Game completed.";
    if (check.winner === 'human') {
      reason = "Tactical perfection! You penetrated Jev's defense and formed 3 in a row.";
    } else if (check.winner === 'jev') {
      reason = "Jev predicted your move trajectory and completed the winning alignment.";
    } else if (check.winner === 'draw') {
      reason = "Stalemate! Neither human nor machine yielded an opening.";
    }

    return {
      finished: check.winner !== null,
      winner: check.winner,
      reason,
      movesCount: state.movesCount,
    };
  },

  formatStateForJev(state: TicTacToeState) {
    const valid = this.getValidActions(state);
    const b = state.board;
    const visual = 
      `Row 0 (Top):    [0: ${b[0] || 'empty'}] [1: ${b[1] || 'empty'}] [2: ${b[2] || 'empty'}]\n` +
      `Row 1 (Middle): [3: ${b[3] || 'empty'}] [4: ${b[4] || 'empty'}] [5: ${b[5] || 'empty'}]\n` +
      `Row 2 (Bottom): [6: ${b[6] || 'empty'}] [7: ${b[7] || 'empty'}] [8: ${b[8] || 'empty'}]`;

    return {
      game_state: {
        game: 'tic-tac-toe',
        board: state.board,
        visual_board: visual,
        turn: 'O',
        human_symbol: 'X',
        jev_symbol: 'O',
        empty_cells: valid,
      },
      valid_actions: valid,
      instructions:
        'You are Jev playing Tic-Tac-Toe as O against human X. Choose the single best cell index (0 to 8) to win or block X. Center is 4.',
    };
  },

  renderBoard({ state, onPlayerAction, isHumanTurn, isThinking }) {
    const isClickable = isHumanTurn && !isThinking && !state.winner;

    return (
      <div className="flex flex-col items-center justify-center p-4">
        {/* Status turn header */}
        <div className="mb-6 flex items-center gap-3 font-mono text-sm">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-jev-cyan" />
            <span className="text-white font-bold">You: X</span>
          </div>
          <span className="text-slate-500 font-bold">vs</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-jev-pink" />
            <span className="text-white font-bold">Jev: O</span>
          </div>
        </div>

        {/* 3x3 Grid */}
        <div className="relative p-3 rounded-3xl bg-jev-surface border-2 border-jev-border shadow-2xl">
          <div className="grid grid-cols-3 gap-3 w-72 h-72 sm:w-84 sm:h-84">
            {state.board.map((cell, index) => {
              const isWinning = state.winningLine?.includes(index);
              const isLastMove = state.lastMoveIndex === index;
              const isEmpty = cell === '';

              return (
                <motion.button
                  key={index}
                  whileHover={isEmpty && isClickable ? { scale: 1.05 } : {}}
                  whileTap={isEmpty && isClickable ? { scale: 0.95 } : {}}
                  onClick={() => {
                    if (isEmpty && isClickable) {
                      sound.playMove();
                      onPlayerAction(index);
                    }
                  }}
                  disabled={!isEmpty || !isClickable}
                  className={`relative rounded-2xl flex flex-col items-center justify-center font-mono font-black text-4xl sm:text-5xl transition-all border select-none ${
                    isWinning
                      ? 'bg-gradient-to-tr from-jev-green/30 to-jev-cyan/30 border-jev-green text-jev-green shadow-glow-green animate-pulse'
                      : cell === 'X'
                      ? 'bg-jev-card/90 border-jev-cyan/50 text-jev-cyan shadow-glow-cyan'
                      : cell === 'O'
                      ? 'bg-jev-card/90 border-jev-pink/60 text-jev-pink shadow-glow-pink'
                      : isClickable
                      ? 'bg-jev-card hover:bg-slate-800/90 border-jev-border hover:border-jev-cyan/60 cursor-pointer group'
                      : 'bg-jev-card/40 border-jev-border/40 cursor-not-allowed opacity-60'
                  }`}
                >
                  {/* Subtle position label tag */}
                  <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-600 group-hover:text-slate-400">
                    {POSITION_LABELS[index]}
                  </span>

                  {cell === 'X' && (
                    <motion.span
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]"
                    >
                      X
                    </motion.span>
                  )}
                  {cell === 'O' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="drop-shadow-[0_0_15px_rgba(255,0,122,0.8)]"
                    >
                      O
                    </motion.span>
                  )}

                  {/* Empty cell preview on hover */}
                  {isEmpty && isClickable && (
                    <span className="opacity-0 group-hover:opacity-25 text-jev-cyan transition-opacity text-3xl font-bold">
                      X
                    </span>
                  )}

                  {/* Recent move pulse ring */}
                  {isLastMove && (
                    <span
                      className={`absolute inset-0 rounded-2xl border-2 pointer-events-none ${
                        cell === 'X' ? 'border-jev-cyan/80 animate-ping' : 'border-jev-pink/80 animate-ping'
                      }`}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Turn helper indicator */}
        <div className="mt-6 font-mono text-xs text-slate-400">
          {state.winner ? (
            <span className="text-jev-green font-bold">Round Over</span>
          ) : isHumanTurn ? (
            <span className="text-jev-cyan animate-pulse">Your turn — Click any open cell</span>
          ) : (
            <span className="text-jev-pink animate-pulse">Jev is computing move...</span>
          )}
        </div>
      </div>
    );
  },
};
