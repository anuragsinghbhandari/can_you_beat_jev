import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Flame, ShieldAlert, Cpu } from 'lucide-react';
import { Game, GameResult, JevDecision } from '../types/game';
import { fetchJevMove, fetchJevTaunt } from '../services/api';
import { sound } from '../services/sound';
import { JevTelemetry } from './JevTelemetry';
import { ResultModal } from './ResultModal';

interface GameRunnerProps {
  game: Game;
  onExit: () => void;
  onNextGame: () => void;
  playerName: string;
}

export const GameRunner: React.FC<GameRunnerProps> = ({
  game,
  onExit,
  onNextGame,
  playerName,
}) => {
  const [gameState, setGameState] = useState<any>(() => game.initialize());
  const [isThinking, setIsThinking] = useState(false);
  const [lastJevDecision, setLastJevDecision] = useState<JevDecision | null>(null);
  const [currentTaunt, setCurrentTaunt] = useState<string>("Let's see if your organic wetware has a chance.");
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const processingRef = useRef(false);

  // Initial taunt on mount
  useEffect(() => {
    fetchJevTaunt('game_start', game.id, playerName).then((t) => {
      if (t?.taunt) setCurrentTaunt(t.taunt);
    });
  }, [game.id, playerName]);

  // Check if Jev needs to make a move
  useEffect(() => {
    const isFinished = game.isFinished(gameState);
    if (isFinished) {
      if (!gameResult) {
        handleGameFinished(gameState);
      }
      return;
    }

    // In turn-based games, check if turn is 'jev'
    const turn = (gameState as any).turn;
    const isJevTurn = turn === 'jev' || (gameState as any).humanGuess !== undefined && (gameState as any).humanGuess !== null && !(gameState as any).revealing;

    if (isJevTurn && !isThinking && !processingRef.current) {
      triggerJevTurn();
    }
  }, [gameState, isThinking, gameResult]);

  const triggerJevTurn = async () => {
    processingRef.current = true;
    setIsThinking(true);

    try {
      const formatted = game.formatStateForJev(gameState);
      const validActions = formatted.valid_actions;

      if (validActions.length === 0) {
        setIsThinking(false);
        processingRef.current = false;
        return;
      }

      // Small natural delay so player observes Jev "thinking"
      const [decision] = await Promise.all([
        fetchJevMove(game.id, formatted.game_state, validActions, 'standard', formatted.instructions),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);

      setLastJevDecision(decision);
      if (decision.commentary) {
        setCurrentTaunt(decision.commentary);
      }

      sound.playJevMove();

      // Apply Jev action
      setGameState((prevState: any) => {
        const nextState = game.applyAction(prevState, decision.action, 'jev');
        if (game.isFinished(nextState)) {
          handleGameFinished(nextState);
        }
        return nextState;
      });
    } catch (e) {
      console.error('Error during Jev turn:', e);
    } finally {
      setIsThinking(false);
      processingRef.current = false;
    }
  };

  const handlePlayerAction = (action: any) => {
    if (isThinking || game.isFinished(gameState)) return;

    sound.playMove();

    setGameState((prevState: any) => {
      const nextState = game.applyAction(prevState, action, 'human');
      if (game.isFinished(nextState)) {
        handleGameFinished(nextState);
      }
      return nextState;
    });
  };

  const handleGameFinished = (finalState: any) => {
    const res = game.getResult(finalState);
    setGameResult(res);

    if (res.winner === 'human') {
      sound.playWin();
    } else if (res.winner === 'jev') {
      sound.playLoss();
    }

    // Open results modal after short pause
    setTimeout(() => {
      setIsResultOpen(true);
    }, 750);
  };

  const handleReset = () => {
    sound.playClick();
    setGameState(game.initialize());
    setLastJevDecision(null);
    setGameResult(null);
    setIsResultOpen(false);
    setIsThinking(false);
    processingRef.current = false;
    fetchJevTaunt('game_start', game.id, playerName).then((t) => {
      if (t?.taunt) setCurrentTaunt(t.taunt);
    });
  };

  const handlePokeJev = () => {
    fetchJevTaunt('poke', game.id, playerName).then((t) => {
      if (t?.taunt) setCurrentTaunt(t.taunt);
    });
  };

  const isHumanTurn =
    !isThinking &&
    !game.isFinished(gameState) &&
    ((gameState as any).turn === undefined || (gameState as any).turn === 'human');

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
      {/* Top Nav Bar */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-jev-border/60">
        <button
          onClick={() => {
            sound.playClick();
            onExit();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-jev-surface hover:bg-jev-hover border border-jev-border text-xs font-mono text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ALL GAMES</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white text-base sm:text-lg">
            {game.name}
          </span>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            • {game.tagline}
          </span>
        </div>

        <button
          onClick={handleReset}
          title="Restart match"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-jev-surface hover:bg-jev-hover border border-jev-border text-xs font-mono text-slate-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">RESTART</span>
        </button>
      </div>

      {/* Main Duel Layout: Telemetry HUD + Game Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Opponent Telemetry & Jev HUD */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          <JevTelemetry
            decision={lastJevDecision}
            isThinking={isThinking}
            taunt={currentTaunt}
            onPoke={handlePokeJev}
          />
        </div>

        {/* Right Column: Game Board Arena */}
        <div className="lg:col-span-7 order-1 lg:order-2">
          <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-jev-border shadow-2xl relative overflow-hidden min-h-[420px] flex items-center justify-center">
            {/* Ambient arena background grid */}
            <div className="absolute inset-0 opacity-20 cyber-grid pointer-events-none" />

            {game.renderBoard({
              state: gameState,
              onPlayerAction: handlePlayerAction,
              isHumanTurn,
              isThinking,
              lastJevDecision,
            })}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <ResultModal
        isOpen={isResultOpen}
        result={gameResult}
        gameName={game.name}
        onRematch={handleReset}
        onNextGame={() => {
          setIsResultOpen(false);
          onNextGame();
        }}
        onClose={() => setIsResultOpen(false)}
      />
    </div>
  );
};
