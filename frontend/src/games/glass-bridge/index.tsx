import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Skull, Zap, Heart, AlertTriangle, ArrowUp, Flag, User, Bot } from 'lucide-react';
import { Game, GameResult } from '../../types/game';
import { sound } from '../../services/sound';

export interface GlassBridgeState {
  stepsCount: number; // 6 rows
  safePath: ('left' | 'right')[];
  revealedPath: Record<number, { safe: 'left' | 'right'; broken: 'left' | 'right' }>;
  humanStep: number; // 0 to 6
  jevStep: number;   // 0 to 6
  humanLives: number;
  jevLives: number;
  maxLives: number;
  turn: 'human' | 'jev';
  winner: 'human' | 'jev' | 'draw' | null;
  movesCount: number;
  lastEvent: string;
  shatteringStep: { step: number; side: 'left' | 'right' } | null;
}

const TOTAL_STEPS = 6;
const STARTING_LIVES = 2;

function generateSafePath(steps: number): ('left' | 'right')[] {
  const path: ('left' | 'right')[] = [];
  for (let i = 0; i < steps; i++) {
    path.push(Math.random() < 0.5 ? 'left' : 'right');
  }
  return path;
}

export const glassBridgeGame: Game<GlassBridgeState, 'left' | 'right'> = {
  id: 'glass-stepping-stones',
  name: 'Glass Stepping Stones',
  tagline: 'Cross the suspended glass abyss before Jev',
  description: 'A deadly 6-step suspended glass bridge. One panel is tempered (safe), the other shatters instantly. Test your nerve against Jev: step forward, remember broken panels, and reach the finish platform.',
  difficulty: 'Hardcore',
  estimatedTime: '~1 min',
  iconName: 'ShieldAlert',
  colorAccent: '#00F0FF',

  initialize(): GlassBridgeState {
    return {
      stepsCount: TOTAL_STEPS,
      safePath: generateSafePath(TOTAL_STEPS),
      revealedPath: {},
      humanStep: 0,
      jevStep: 0,
      humanLives: STARTING_LIVES,
      jevLives: STARTING_LIVES,
      maxLives: STARTING_LIVES,
      turn: 'human',
      winner: null,
      movesCount: 0,
      lastEvent: 'Step forward onto Left or Right panel to cross Step 1.',
      shatteringStep: null,
    };
  },

  getValidActions(state: GlassBridgeState): ('left' | 'right')[] {
    if (state.winner) return [];
    return ['left', 'right'];
  },

  applyAction(state: GlassBridgeState, action: 'left' | 'right', player: 'human' | 'jev'): GlassBridgeState {
    if (state.winner) return state;

    const currentStep = player === 'human' ? state.humanStep : state.jevStep;
    if (currentStep >= state.stepsCount) return state;

    const correctSide = state.safePath[currentStep];
    const isSafe = action === correctSide;
    const otherSide: 'left' | 'right' = action === 'left' ? 'right' : 'left';

    const newRevealed = {
      ...state.revealedPath,
      [currentStep]: {
        safe: isSafe ? action : otherSide,
        broken: isSafe ? otherSide : action,
      },
    };

    let newHumanStep = state.humanStep;
    let newJevStep = state.jevStep;
    let newHumanLives = state.humanLives;
    let newJevLives = state.jevLives;
    let nextTurn: 'human' | 'jev' = state.turn;
    let eventText = '';
    let winner: 'human' | 'jev' | 'draw' | null = null;
    let shattering: { step: number; side: 'left' | 'right' } | null = null;

    if (isSafe) {
      sound.playGlassSafe();
      if (player === 'human') {
        newHumanStep += 1;
        eventText = `Solid glass! You advanced safely to Step ${newHumanStep} of ${state.stepsCount}. Keep going!`;
        if (newHumanStep >= state.stepsCount) {
          winner = 'human';
          eventText = 'VICTORY! You crossed the entire glass bridge!';
        } else {
          nextTurn = 'human'; // Reward safe step with momentum
        }
      } else {
        newJevStep += 1;
        eventText = `Jev stepped on tempered glass at Step ${newJevStep}. It advances!`;
        if (newJevStep >= state.stepsCount) {
          winner = 'jev';
          eventText = 'Jev crossed the finish line first!';
        } else {
          nextTurn = 'jev';
        }
      }
    } else {
      // Fragile glass shatters!
      sound.playGlassShatter();
      shattering = { step: currentStep, side: action };

      if (player === 'human') {
        newHumanLives = Math.max(0, newHumanLives - 1);
        eventText = newHumanLives > 0
          ? `SHATTER! The ${action} glass broke under you! Life lost (${newHumanLives}/${state.maxLives}). Turn passes to Jev.`
          : `SHATTER! The ${action} glass broke under you! You have no retries left. Jev must now finish or run out of lives.`;
        nextTurn = 'jev';
      } else {
        newJevLives = Math.max(0, newJevLives - 1);
        eventText = newJevLives > 0
          ? `CRASH! Jev shattered the ${action} panel! Jev lost a life (${newJevLives}/${state.maxLives}). Your turn!`
          : `CRASH! Jev shattered the ${action} panel! Jev has no retries left. You win if Jev cannot finish the bridge.`;
        if (newJevLives <= 0) {
          winner = newHumanLives <= 0 ? 'draw' : 'human';
          eventText = newHumanLives <= 0
            ? 'Both players used all lives before reaching the finish. The bridge duel is a draw.'
            : 'Jev used both lives before reaching the finish. Humanity wins!';
        } else {
          nextTurn = newHumanLives > 0 ? 'human' : 'jev';
        }
      }
    }

    return {
      ...state,
      revealedPath: newRevealed,
      humanStep: newHumanStep,
      jevStep: newJevStep,
      humanLives: newHumanLives,
      jevLives: newJevLives,
      turn: nextTurn,
      winner,
      movesCount: state.movesCount + 1,
      lastEvent: eventText,
      shatteringStep: shattering,
    };
  },

  isFinished(state: GlassBridgeState): boolean {
    return state.winner !== null;
  },

  getResult(state: GlassBridgeState): GameResult {
    let reason = "Glass Bridge duel concluded.";
    if (state.winner === 'human') {
      reason = state.humanStep >= state.stepsCount
        ? `Glorious crossing! You crossed all ${state.stepsCount} glass steps while Jev only reached Step ${state.jevStep}.`
        : `Jev exhausted both lives before reaching the finish. You claimed victory!`;
    } else if (state.winner === 'jev') {
      reason = `Jev crossed the final platform first! Its probability matrix deduced the path.`;
    } else if (state.winner === 'draw') {
      reason = 'Both players exhausted their lives before reaching the finish. The bridge duel ends in a draw.';
    }

    return {
      finished: state.winner !== null,
      winner: state.winner,
      reason,
      movesCount: state.movesCount,
    };
  },

  formatStateForJev(state: GlassBridgeState) {
    const currentStep = state.jevStep;
    const known = state.revealedPath[currentStep];

    const history: Record<string, string> = {};
    Object.entries(state.revealedPath).forEach(([k, v]) => {
      history[k] = `Step ${Number(k) + 1}: ${v.safe} is SAFE, ${v.broken} is BROKEN`;
    });

    return {
      game_state: {
        game: 'glass-stepping-stones',
        current_step: currentStep,
        total_steps: state.stepsCount,
        revealed_panels: known ? { [currentStep]: known.safe } : {},
        history,
        jev_lives: state.jevLives,
        human_lives: state.humanLives,
      },
      valid_actions: ['left', 'right'],
      instructions: known
        ? `Step ${currentStep + 1} has already been tested. The ${known.safe} panel is guaranteed SAFE. Choose ${known.safe}.`
        : `You are at Step ${currentStep + 1} of ${state.stepsCount}. One glass panel is tempered (safe), one will shatter. Choose 'left' or 'right'.`,
    };
  },

  renderBoard({ state, onPlayerAction, isHumanTurn, isThinking }) {
    const isClickable = isHumanTurn && !isThinking && !state.winner && state.humanLives > 0;
    const currentActiveStep = state.humanStep;

    return (
      <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full">
        {/* Top Status & Lives */}
        <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-jev-surface border border-jev-border mb-4 font-mono text-xs">
          {/* Human Lives */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-jev-cyan/15 border border-jev-cyan/40 flex items-center justify-center text-jev-cyan">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">YOU (STEP {state.humanStep}/{state.stepsCount})</span>
              <div className="flex gap-1 mt-0.5">
                {Array.from({ length: state.maxLives }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < state.humanLives ? 'text-red-500 fill-red-500' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              BRIDGE PROGRESS
            </span>
            <span className="text-white font-bold text-sm">
              {Math.max(state.humanStep, state.jevStep)} / {state.stepsCount} PASSED
            </span>
          </div>

          {/* Jev Lives */}
          <div className="flex items-center gap-2 text-right">
            <div>
              <span className="text-slate-400 block text-[10px]">JEV (STEP {state.jevStep}/{state.stepsCount})</span>
              <div className="flex gap-1 justify-end mt-0.5">
                {Array.from({ length: state.maxLives }).map((_, i) => (
                  <Zap
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < state.jevLives ? 'text-jev-pink fill-jev-pink' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-jev-pink/15 border border-jev-pink/40 flex items-center justify-center text-jev-pink">
              <Bot className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Suspended Bridge Ladder View (From Finish at Top to Start at Bottom) */}
        <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-950 via-jev-surface to-slate-950 p-4 border-2 border-jev-border shadow-2xl overflow-hidden">
          {/* Neon Bridge Side Cables */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-jev-cyan/60 via-jev-purple/40 to-jev-cyan/60 opacity-60" />
          <div className="absolute right-6 top-0 bottom-0 w-1 bg-gradient-to-b from-jev-cyan/60 via-jev-purple/40 to-jev-cyan/60 opacity-60" />

          {/* Finish Platform */}
          <div className="mb-3 py-2 px-4 rounded-xl bg-gradient-to-r from-jev-green/20 to-teal-500/20 border border-jev-green/40 text-center font-mono text-xs text-jev-green font-bold flex items-center justify-center gap-2 shadow-glow-green">
            <Flag className="w-4 h-4" />
            <span>FINISH PLATFORM (SAFETY)</span>
          </div>

          {/* 6 Step Rows (Row 5 down to Row 0) */}
          <div className="space-y-2.5">
            {Array.from({ length: state.stepsCount })
              .map((_, i) => state.stepsCount - 1 - i) // Reverse: step 5 down to 0
              .map((stepIndex) => {
                const isCurrentHumanStep = isHumanTurn && currentActiveStep === stepIndex;
                const revealed = state.revealedPath[stepIndex];
                const isHumanHere = state.humanStep === stepIndex;
                const isJevHere = state.jevStep === stepIndex;

                return (
                  <div key={stepIndex} className="relative flex items-center justify-between gap-3 px-2">
                    {/* Step label pill */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-400 select-none shadow">
                      STEP {stepIndex + 1}
                    </div>

                    {/* Left Glass Panel */}
                    <motion.button
                      whileHover={isCurrentHumanStep && isClickable ? { scale: 1.04 } : {}}
                      whileTap={isCurrentHumanStep && isClickable ? { scale: 0.96 } : {}}
                      onClick={() => {
                        if (isCurrentHumanStep && isClickable) {
                          onPlayerAction('left');
                        }
                      }}
                      disabled={!isCurrentHumanStep || !isClickable}
                      className={`flex-1 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-all relative overflow-hidden border ${
                        revealed?.broken === 'left'
                          ? 'bg-red-950/60 border-red-800 text-red-500 opacity-60'
                          : revealed?.safe === 'left'
                          ? 'bg-jev-green/20 border-jev-green text-jev-green shadow-glow-green'
                          : isCurrentHumanStep && isClickable
                          ? 'bg-jev-card/90 hover:bg-slate-800/90 border-jev-cyan/60 hover:border-jev-cyan text-jev-cyan cursor-pointer shadow-lg animate-pulse-subtle'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-600'
                      }`}
                    >
                      {revealed?.broken === 'left' ? (
                        <span className="text-[10px] text-red-400">SHATTERED</span>
                      ) : revealed?.safe === 'left' ? (
                        <span className="text-[10px] font-bold">TEMPERED ✓</span>
                      ) : (
                        <span>LEFT</span>
                      )}

                      {/* Character Pin on Left Panel */}
                      {isHumanHere && (
                        <span className="absolute top-1 left-2 w-2 h-2 rounded-full bg-jev-cyan animate-ping" />
                      )}
                      {isJevHere && (
                        <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-jev-pink animate-ping" />
                      )}
                    </motion.button>

                    {/* Right Glass Panel */}
                    <motion.button
                      whileHover={isCurrentHumanStep && isClickable ? { scale: 1.04 } : {}}
                      whileTap={isCurrentHumanStep && isClickable ? { scale: 0.96 } : {}}
                      onClick={() => {
                        if (isCurrentHumanStep && isClickable) {
                          onPlayerAction('right');
                        }
                      }}
                      disabled={!isCurrentHumanStep || !isClickable}
                      className={`flex-1 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-all relative overflow-hidden border ${
                        revealed?.broken === 'right'
                          ? 'bg-red-950/60 border-red-800 text-red-500 opacity-60'
                          : revealed?.safe === 'right'
                          ? 'bg-jev-green/20 border-jev-green text-jev-green shadow-glow-green'
                          : isCurrentHumanStep && isClickable
                          ? 'bg-jev-card/90 hover:bg-slate-800/90 border-jev-cyan/60 hover:border-jev-cyan text-jev-cyan cursor-pointer shadow-lg animate-pulse-subtle'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-600'
                      }`}
                    >
                      {revealed?.broken === 'right' ? (
                        <span className="text-[10px] text-red-400">SHATTERED</span>
                      ) : revealed?.safe === 'right' ? (
                        <span className="text-[10px] font-bold">TEMPERED ✓</span>
                      ) : (
                        <span>RIGHT</span>
                      )}

                      {/* Character Pin on Right Panel */}
                      {isHumanHere && (
                        <span className="absolute top-1 left-2 w-2 h-2 rounded-full bg-jev-cyan animate-ping" />
                      )}
                      {isJevHere && (
                        <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-jev-pink animate-ping" />
                      )}
                    </motion.button>
                  </div>
                );
              })}
          </div>

          {/* Start Platform */}
          <div className="mt-3 py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
            <ArrowUp className="w-3.5 h-3.5 text-jev-cyan" />
            <span>START PLATFORM</span>
          </div>
        </div>

        {/* Dynamic Event Ticker */}
        <div className="mt-4 font-mono text-xs text-center text-slate-300 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl max-w-sm w-full">
          {state.winner ? (
            <span
              className={`font-bold ${
                state.winner === 'human'
                  ? 'text-jev-green'
                  : state.winner === 'draw'
                  ? 'text-jev-amber'
                  : 'text-jev-pink'
              }`}
            >
              {state.winner === 'human'
                ? state.humanStep >= state.stepsCount
                  ? 'YOU WIN: YOU CROSSED THE BRIDGE'
                  : 'YOU WIN: JEV RAN OUT OF LIVES'
                : state.winner === 'draw'
                ? 'DRAW: BOTH PLAYERS RAN OUT OF LIVES'
                : state.jevStep >= state.stepsCount
                ? 'JEV WINS: JEV CROSSED THE BRIDGE'
                : 'JEV WINS: YOU RAN OUT OF LIVES'}
            </span>
          ) : isThinking ? (
            <span className="text-jev-pink animate-pulse">
              Jev analyzing acoustic resonance of Step {state.jevStep + 1}...
            </span>
          ) : state.humanLives <= 0 ? (
            <span className="text-jev-pink animate-pulse">
              You are out of retries — waiting for Jev to finish or fall.
            </span>
          ) : isHumanTurn ? (
            <span className="text-jev-cyan animate-pulse">
              Your turn — Click Left or Right for Step {state.humanStep + 1}!
            </span>
          ) : (
            <span className="text-slate-400">Jev preparing to step...</span>
          )}
          <div className="text-[11px] text-slate-400 mt-1 italic">{state.lastEvent}</div>
        </div>
      </div>
    );
  },
};
