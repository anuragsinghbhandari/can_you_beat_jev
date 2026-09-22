import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Sparkles,
  ArrowRight,
  Swords,
} from 'lucide-react';
import { ALL_GAMES, getGameById } from './games/registry';
import { Game } from './types/game';
import { Header } from './components/Header';
import { GameCard } from './components/GameCard';
import { GameRunner } from './components/GameRunner';
import { JevAvatar } from './components/JevAvatar';
import { sound } from './services/sound';

export const App: React.FC = () => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [heroTauntIndex, setHeroTauntIndex] = useState(0);

  const gamesSectionRef = useRef<HTMLDivElement>(null);

  const heroTaunts = [
    "“Think your biological wetware has a chance? Pick a game and prove it.”",
    "“I've calculated 4.2 million outcomes. You win in approximately zero of them.”",
    "“Another organic contender. Do you want me to use 10% of my parameters or 20%?”",
    "“TypeSafe System One is ready. Are your neural synapses warmed up?”",
  ];

  const scrollToGames = () => {
    sound.playClick();
    gamesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartGame = (gameId: string) => {
    setActiveGameId(gameId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextGame = () => {
    if (!activeGameId) return;
    const currentIndex = ALL_GAMES.findIndex((g) => g.id === activeGameId);
    const nextIndex = (currentIndex + 1) % ALL_GAMES.length;
    setActiveGameId(ALL_GAMES[nextIndex].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeGame = activeGameId ? getGameById(activeGameId) : null;

  return (
    <div className="min-h-screen bg-jev-bg text-slate-100 flex flex-col cyber-radial-glow selection:bg-jev-cyan selection:text-black">
      {/* Universal Navigation Header */}
      <Header
        onGoHome={() => setActiveGameId(null)}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {activeGame ? (
          /* Active Game Duel Arena */
          <GameRunner
            key={activeGame.id}
            game={activeGame}
            onExit={() => setActiveGameId(null)}
            onNextGame={handleNextGame}
            playerName="Player"
          />
        ) : (
          /* Landing Homepage */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-16 sm:space-y-24">
            {/* HERO SECTION */}
            <section className="relative flex flex-col items-center text-center pt-4 sm:pt-10">
              {/* Jev Floating Opponent Avatar in Hero */}
              <div
                onClick={() => {
                  sound.playClick();
                  setHeroTauntIndex((prev) => (prev + 1) % heroTaunts.length);
                }}
                className="mb-6 cursor-pointer group"
                title="Click to hear Jev's remark"
              >
                <motion.div
                  animate={{ y: [-6, 6, -6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <JevAvatar expression="smug" size="hero" showStatusBadge />
                </motion.div>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-jev-card border border-jev-border text-xs font-mono text-slate-400 group-hover:border-jev-cyan transition-colors">
                  <span className="w-2 h-2 rounded-full bg-jev-cyan animate-pulse" />
                  <span>JEV • SYSTEM ONE DECISION MODEL</span>
                </div>
              </div>

              {/* Jev Dynamic Speech Bubble */}
              <motion.div
                key={heroTauntIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md p-3.5 mb-8 rounded-2xl bg-jev-card/90 border border-jev-border-bright text-sm text-slate-200 shadow-xl font-mono italic"
              >
                {heroTaunts[heroTauntIndex]}
                <span className="block text-[10px] text-jev-cyan not-italic mt-1">
                  (Click Jev to cycle remarks)
                </span>
              </motion.div>

              {/* Title & Subtitle */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-white uppercase drop-shadow-lg"
              >
                CAN YOU BEAT <span className="text-jev-cyan underline decoration-jev-pink decoration-4">JEV</span>?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 sm:mt-6 text-xl sm:text-2xl font-bold font-sans text-slate-300 max-w-2xl leading-relaxed"
              >
                Human vs AI. One game at a time.
              </motion.p>

              {/* Hero Call To Actions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
              >
                <button
                  onClick={scrollToGames}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-jev-cyan to-teal-400 text-black font-mono font-black text-base sm:text-lg tracking-wider uppercase shadow-glow-cyan hover:shadow-cyan-400/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>PLAY NOW</span>
                </button>

              </motion.div>
            </section>

            {/* YOUR MISSION SECTION */}
            <section className="relative">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-jev-purple/10 border border-jev-purple/30 text-jev-purple text-xs font-mono font-bold tracking-wider uppercase mb-3">
                  <Swords className="w-3.5 h-3.5" />
                  YOUR MISSION
                </div>
                  <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white uppercase">
                  BEAT JEV. MASTER THE GAMES.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel rounded-2xl p-6 border border-jev-border relative overflow-hidden group hover:border-jev-cyan/60 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-jev-cyan/15 border border-jev-cyan/40 flex items-center justify-center text-jev-cyan font-black font-mono text-xl mb-4">
                    01
                  </div>
                  <h3 className="text-lg font-bold font-mono text-white mb-2">Beat Jev</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    Outsmart TypeSafe's real System One AI model across quick, high-stakes tactical micro-games.
                  </p>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-jev-border relative overflow-hidden group hover:border-jev-amber/60 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-jev-amber/15 border border-jev-amber/40 flex items-center justify-center text-jev-amber font-black font-mono text-xl mb-4">
                    02
                  </div>
                  <h3 className="text-lg font-bold font-mono text-white mb-2">Read The Board</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    Use the state, spot the pattern, and make the move that beats Jev.
                  </p>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-jev-border relative overflow-hidden group hover:border-jev-purple/60 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-jev-purple/15 border border-jev-purple/40 flex items-center justify-center text-jev-purple font-black font-mono text-xl mb-4">
                    03
                  </div>
                  <h3 className="text-lg font-bold font-mono text-white mb-2">Play Again</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    Each round generates a fresh challenge. Try a different game when you are ready.
                  </p>
                </div>
              </div>
            </section>

            {/* AVAILABLE GAMES SECTION */}
            <section ref={gamesSectionRef} id="games" className="scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-jev-cyan/10 border border-jev-cyan/30 text-jev-cyan text-xs font-mono font-bold tracking-wider uppercase mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    SELECT YOUR CHALLENGE
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white uppercase">
                    AVAILABLE GAMES
                  </h2>
                  <p className="text-sm text-slate-400 font-sans mt-1">
                    Pick any game to duel Jev immediately. Games take 45–90 seconds.
                  </p>
                </div>

                <div className="font-mono text-xs text-slate-400">3 tactical challenges</div>
              </div>

              {/* Game Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ALL_GAMES.map((game, idx) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={idx}
                    onPlay={handleStartGame}
                  />
                ))}
              </div>
            </section>

            {/* QUICK FEATURE BANNER */}
            <section className="rounded-3xl bg-gradient-to-r from-jev-surface via-slate-900 to-jev-surface border border-jev-border p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2 max-w-xl text-center md:text-left">
                <span className="text-xs font-mono font-bold text-jev-cyan tracking-wider uppercase">
                  TYPE-SAFE AI ARCHITECTURE
                </span>
                <h3 className="text-2xl font-black font-mono text-white uppercase">
                  REAL-TIME DECISION TELEMETRY
                </h3>
                <p className="text-sm text-slate-300 font-sans">
                  Every move Jev makes comes directly from TypeSafe's System One model via secure backend inference. Watch its confidence meter and probability distributions in real time as you play.
                </p>
              </div>

              <button
                onClick={() => handleStartGame('tic-tac-toe')}
                className="shrink-0 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-200 text-black font-mono font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl"
              >
                <span>CHALLENGE JEV NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-jev-border/60 bg-jev-surface/60 py-8 px-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-jev-cyan" />
            <span className="text-slate-400 font-bold">CAN YOU BEAT JEV?</span>
            <span>— Human vs AI Gaming Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by TypeSafe System One (Jev)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
