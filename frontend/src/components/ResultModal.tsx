import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Share2, Check, RotateCcw, ArrowRight } from 'lucide-react';
import { GameResult } from '../types/game';
import { JevAvatar } from './JevAvatar';
import { sound } from '../services/sound';

interface ResultModalProps {
  isOpen: boolean;
  result: GameResult | null;
  gameName: string;
  onRematch: () => void;
  onNextGame: () => void;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  result,
  gameName,
  onRematch,
  onNextGame,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen && result?.winner === 'human') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#FF007A', '#00FF88', '#A855F7'],
      });
    }
  }, [isOpen, result?.winner]);

  if (!isOpen || !result) return null;

  const isHumanWin = result.winner === 'human';
  const isJevWin = result.winner === 'jev';
  const isDraw = result.winner === 'draw';

  const avatarExpr = isHumanWin
    ? 'glitching'
    : isJevWin
    ? 'evil_laugh'
    : 'thinking';

  const titleText = isHumanWin
    ? 'YOU BEAT JEV!'
    : isJevWin
    ? 'JEV DEFEATED YOU'
    : 'TACTICAL STALEMATE';

  const titleColor = isHumanWin
    ? 'text-jev-green'
    : isJevWin
    ? 'text-jev-pink'
    : 'text-jev-amber';

  const shareText = `🤖 CAN YOU BEAT JEV?
🎮 ${gameName}: ${isHumanWin ? 'HUMAN VICTORY 🏆' : isJevWin ? 'JEV WON 🦾' : 'DRAW 🤝'}
⚡ Turns: ${result.movesCount}
👉 Challenge Jev`;

  const handleShare = async () => {
    sound.playClick();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-jev-card border-2 border-jev-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center"
        >
          {/* Top colored accent bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-2 ${
              isHumanWin ? 'bg-jev-green' : isJevWin ? 'bg-jev-pink' : 'bg-jev-amber'
            }`}
          />

          {/* Jev Opponent Expression */}
          <div className="flex justify-center mb-4">
            <JevAvatar expression={avatarExpr} size="lg" />
          </div>

          {/* Big Outcome Banner */}
          <h2 className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mb-2 ${titleColor}`}>
            {titleText}
          </h2>
          <p className="text-sm text-slate-300 font-sans mb-4">
            {result.reason}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-jev-surface border border-jev-border text-left font-mono text-xs mb-5">
            <div>
              <span className="text-slate-400 block text-[11px]">GAME</span>
              <span className="text-white font-bold">{gameName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">MOVES EVALUATED</span>
              <span className="text-jev-cyan font-bold">{result.movesCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">MODEL</span>
              <span className="text-slate-300 font-bold">TypeSafe System One</span>
            </div>
          </div>

          {/* Jev's closing reaction */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 italic mb-6">
            "{isHumanWin
              ? "System error: A human beat my inference weights?! You got lucky this time."
              : isJevWin
              ? "Checkmate. Another data point proving synthetic superiority. Want to try again?"
              : "A calculated draw. We are evenly matched... for now."}"
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Shareable Button */}
            <button
              onClick={handleShare}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-jev-cyan/20 to-jev-purple/20 hover:from-jev-cyan hover:to-jev-purple text-jev-cyan hover:text-black font-mono font-bold text-xs uppercase tracking-wider border border-jev-cyan/40 transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span>COPIED RESULT TO CLIPBOARD!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>SHARE RESULT (COPY STATS)</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  sound.playClick();
                  onRematch();
                }}
                className="py-3 px-4 rounded-xl bg-jev-surface hover:bg-jev-hover border border-jev-border text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REMATCH</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onNextGame();
                }}
                className="py-3 px-4 rounded-xl bg-white hover:bg-slate-200 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <span>NEXT GAME</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
