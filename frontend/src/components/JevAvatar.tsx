import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sound } from '../services/sound';

export type JevExpression = 'smug' | 'thinking' | 'sweating' | 'evil_laugh' | 'glitching' | 'confident';

interface JevAvatarProps {
  expression?: JevExpression;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  isThinking?: boolean;
  onPoke?: () => void;
  className?: string;
  showStatusBadge?: boolean;
}

export const JevAvatar: React.FC<JevAvatarProps> = ({
  expression = 'confident',
  size = 'md',
  isThinking = false,
  onPoke,
  className = '',
  showStatusBadge = false,
}) => {
  const [poked, setPoked] = useState(false);

  const handleAvatarClick = () => {
    sound.playClick();
    setPoked(true);
    setTimeout(() => setPoked(false), 500);
    if (onPoke) {
      onPoke();
    }
  };

  const sizeDimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    hero: 'w-32 h-32 md:w-40 md:h-40',
  }[size];

  // Dynamic colors depending on state
  const isGlitching = expression === 'glitching' || poked;
  const isEvil = expression === 'evil_laugh';
  const isSweating = expression === 'sweating';

  const eyeColor = isGlitching
    ? '#FF007A'
    : isEvil
    ? '#FF3366'
    : isSweating
    ? '#FFB800'
    : '#00F0FF';

  const glowColor = isGlitching
    ? 'rgba(255, 0, 122, 0.5)'
    : isEvil
    ? 'rgba(255, 51, 102, 0.4)'
    : 'rgba(0, 240, 255, 0.35)';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer ambient glow */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: isThinking ? [0.4, 0.8, 0.4] : [0.25, 0.45, 0.25],
        }}
        transition={{ repeat: Infinity, duration: isThinking ? 1.2 : 3, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      {/* Main Avatar Body */}
      <motion.div
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleAvatarClick}
        className={`${sizeDimensions} relative rounded-2xl bg-gradient-to-b from-jev-surface to-jev-card border-2 border-jev-border hover:border-jev-cyan cursor-pointer transition-colors shadow-2xl flex items-center justify-center select-none overflow-hidden group`}
      >
        {/* Subtle grid pattern inside helmet */}
        <div className="absolute inset-0 opacity-15 cyber-grid pointer-events-none" />

        {/* Visor / Face SVG */}
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 z-10">
          <defs>
            <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#08090E" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Visor Outline */}
          <rect
            x="14"
            y="18"
            width="72"
            height="64"
            rx="16"
            fill="url(#visorGrad)"
            stroke="#20283C"
            strokeWidth="2.5"
          />

          {/* Neural Antenna Pulse */}
          <line x1="50" y1="18" x2="50" y2="8" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
          <circle
            cx="50"
            cy="7"
            r={isThinking ? 4 : 3}
            fill={eyeColor}
            filter="url(#neonGlow)"
            className={isThinking ? "animate-pulse" : ""}
          />

          {/* JEV Eyes & Expression */}
          <g filter="url(#neonGlow)">
            {/* Thinking / Scanning Line */}
            {isThinking && (
              <motion.rect
                x="22"
                width="56"
                height="3"
                rx="1.5"
                fill="#00F0FF"
                animate={{ y: [30, 60, 30] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              />
            )}

            {/* Left Eye */}
            <motion.ellipse
              cx="35"
              cy="45"
              rx={expression === 'smug' ? 7 : expression === 'evil_laugh' ? 8 : 6}
              ry={expression === 'smug' ? 3 : isSweating ? 8 : 6}
              fill={eyeColor}
              animate={
                isThinking
                  ? { rx: [4, 7, 4], opacity: [0.7, 1, 0.7] }
                  : isGlitching
                  ? { x: [-2, 2, -1, 1], y: [0, -1, 1, 0] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: isGlitching ? 0.15 : 2 }}
            />

            {/* Right Eye */}
            <motion.ellipse
              cx="65"
              cy="45"
              rx={expression === 'evil_laugh' ? 8 : 6}
              ry={expression === 'smug' ? 5 : isSweating ? 8 : 6}
              fill={eyeColor}
              animate={
                isThinking
                  ? { rx: [4, 7, 4], opacity: [0.7, 1, 0.7] }
                  : isGlitching
                  ? { x: [2, -2, 1, -1], y: [0, 1, -1, 0] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: isGlitching ? 0.15 : 2 }}
            />

            {/* Pupils / Highlights */}
            {!isThinking && (
              <>
                <circle cx="37" cy="43" r="2" fill="#FFFFFF" />
                <circle cx="67" cy="43" r="2" fill="#FFFFFF" />
              </>
            )}

            {/* Mouth / LED Grin / Grimace */}
            {expression === 'evil_laugh' && (
              <path
                d="M32 64 Q50 78 68 64"
                stroke={eyeColor}
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
            )}
            {expression === 'smug' && (
              <path
                d="M36 64 Q50 67 66 60"
                stroke={eyeColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            )}
            {expression === 'sweating' && (
              <>
                <path
                  d="M36 65 Q50 60 64 65"
                  stroke={eyeColor}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Sweat droplet */}
                <ellipse cx="76" cy="38" rx="2.5" ry="4" fill="#00F0FF" />
              </>
            )}
            {expression === 'glitching' && (
              <path
                d="M34 62 L42 66 L50 60 L58 66 L66 61"
                stroke={eyeColor}
                strokeWidth="2.5"
                fill="none"
              />
            )}
            {(expression === 'confident' || (!expression && !isThinking)) && (
              <line x1="36" y1="63" x2="64" y2="63" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
            )}
          </g>
        </svg>

        {/* Pokable feedback ripple */}
        <AnimatePresence>
          {poked && (
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full border-2 border-jev-pink pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Online indicator badge */}
      {showStatusBadge && (
        <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jev-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-jev-cyan border-2 border-jev-bg"></span>
          </span>
        </div>
      )}
    </div>
  );
};
