import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, ShieldAlert, Grid, HelpCircle, Eye, Binary, Compass } from 'lucide-react';
import { Game } from '../types/game';
import { sound } from '../services/sound';

interface GameCardProps {
  game: Game;
  onPlay: (gameId: string) => void;
  index: number;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'Grid': <Grid className="w-6 h-6" />,
  'ShieldAlert': <ShieldAlert className="w-6 h-6" />,
  'HelpCircle': <HelpCircle className="w-6 h-6" />,
  'Eye': <Eye className="w-6 h-6" />,
  'Binary': <Binary className="w-6 h-6" />,
  'Compass': <Compass className="w-6 h-6" />,
};

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay, index }) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Casual':
        return 'bg-jev-green/15 text-jev-green border-jev-green/30';
      case 'Tactical':
        return 'bg-jev-cyan/15 text-jev-cyan border-jev-cyan/30';
      case 'Hardcore':
        return 'bg-jev-pink/15 text-jev-pink border-jev-pink/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const handlePlayClick = () => {
    sound.playClick();
    onPlay(game.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      whileHover={{ y: -6 }}
      className="glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between relative group overflow-hidden border border-jev-border"
    >
      {/* Background card accent glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-jev-cyan/10 to-transparent rounded-full blur-2xl group-hover:bg-jev-cyan/20 transition-all pointer-events-none" />

      {/* Top Meta: Badges & Time */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border ${getDifficultyBadge(
                game.difficulty
              )}`}
            >
              {game.difficulty}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              {game.estimatedTime}
            </span>
          </div>

        </div>

        {/* Game Icon & Title */}
        <div className="flex items-start gap-4 mb-3">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-jev-surface border border-jev-border-bright flex items-center justify-center text-jev-cyan group-hover:border-jev-cyan group-hover:scale-105 transition-all shadow-md">
            {ICON_MAP[game.iconName] || <Grid className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-bold font-mono tracking-tight text-white group-hover:text-jev-cyan transition-colors">
              {game.name}
            </h3>
            <p className="text-xs font-mono text-jev-cyan/80 font-medium">
              {game.tagline}
            </p>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-sm text-slate-300 font-sans leading-relaxed mb-6">
          {game.description}
        </p>
      </div>

      {/* Play Button Action */}
      <div className="pt-4 border-t border-jev-border/60">
        <button
          onClick={handlePlayClick}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-jev-surface to-jev-card hover:from-jev-cyan hover:to-jev-cyan text-slate-200 hover:text-black font-mono font-bold text-sm tracking-wider uppercase border border-jev-border group-hover:border-jev-cyan transition-all flex items-center justify-center gap-2 shadow-lg group-hover:shadow-glow-cyan"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>PLAY NOW</span>
        </button>
      </div>
    </motion.div>
  );
};
