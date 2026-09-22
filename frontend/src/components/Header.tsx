import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '../services/sound';

interface HeaderProps {
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
}) => {
  const [muted, setMuted] = useState(sound.getMuted());

  const handleToggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-jev-border/80 bg-jev-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-jev-cyan/20 to-jev-purple/20 border border-jev-cyan/40 group-hover:border-jev-cyan transition-all group-hover:shadow-glow-cyan">
            <span className="font-mono font-black text-jev-cyan text-base">J</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-jev-pink rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-jev-pink rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black tracking-tight text-white text-base sm:text-lg uppercase">
                CAN YOU BEAT <span className="text-jev-cyan">JEV</span>?
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-jev-purple/20 text-jev-purple border border-jev-purple/30 rounded font-bold">
                AI ARENA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide -mt-0.5">
              TYPE-SAFE SYSTEM ONE DUEL
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 rounded-xl bg-jev-card hover:bg-jev-hover border border-jev-border text-slate-400 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-jev-cyan" />}
          </button>
        </div>
      </div>
    </header>
  );
};
