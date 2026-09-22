import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Activity, MessageSquareQuote } from 'lucide-react';
import { JevDecision } from '../types/game';
import { JevAvatar } from './JevAvatar';

interface JevTelemetryProps {
  decision: JevDecision | null;
  isThinking: boolean;
  taunt: string;
  onPoke?: () => void;
  compact?: boolean;
}

export const JevTelemetry: React.FC<JevTelemetryProps> = ({
  decision,
  isThinking,
  taunt,
  onPoke,
  compact = false,
}) => {
  const confidence = decision?.confidence ?? 0.5;
  const confidencePercent = Math.round(confidence * 100);
  const latency = decision?.latency_ms ?? 140;
  const modelName = decision?.model || 'jev-latest (System One)';
  const expression = decision?.expression || (isThinking ? 'thinking' : 'confident');

  const probEntries = decision?.probabilities
    ? Object.entries(decision.probabilities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
    : [];

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-5 relative overflow-hidden border border-jev-border shadow-2xl">
      {/* Background ambient pulse */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-jev-purple/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-jev-border text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-jev-cyan" />
          <span className="text-slate-300 font-semibold uppercase tracking-wider">Opponent Telemetry</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3 h-3 text-jev-amber" />
            <span>{isThinking ? 'thinking...' : `${latency}ms`}</span>
          </div>
          <div className="flex items-center gap-1 text-jev-cyan">
            <span className="w-2 h-2 rounded-full bg-jev-cyan animate-pulse" />
            <span className="truncate max-w-[110px]">{modelName}</span>
          </div>
        </div>
      </div>

      {/* Opponent Identity & Dialogue */}
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 flex flex-col items-center">
          <JevAvatar
            expression={expression}
            size={compact ? 'md' : 'lg'}
            isThinking={isThinking}
            onPoke={onPoke}
            showStatusBadge
          />
          <span className="mt-1 text-[11px] font-mono font-bold tracking-widest text-jev-cyan uppercase">
            JEV
          </span>
        </div>

        {/* Speech Bubble */}
        <div className="flex-1 relative">
          <div className="relative bg-jev-card/90 border border-jev-border rounded-xl p-3 text-sm text-slate-200 shadow-md">
            {/* Pointer arrow to avatar */}
            <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-jev-border border-b-8 border-b-transparent" />
            <div className="absolute -left-1.5 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-jev-card border-b-8 border-b-transparent" />

            <div className="flex items-center gap-1.5 text-xs text-jev-cyan/90 font-mono mb-1">
              <MessageSquareQuote className="w-3 h-3" />
              <span>Jev remarks:</span>
            </div>

            <p className="italic text-slate-100 font-sans leading-snug">
              {isThinking ? (
                <span className="animate-pulse text-jev-cyan font-mono text-xs">
                  Thinking... running System One inference tree...
                </span>
              ) : (
                `"${decision?.commentary || taunt || "Let's see what you've got, human."}"`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Decision Analytics HUD */}
      {!compact && (
        <div className="space-y-3 pt-2 border-t border-jev-border/60">
          {/* Confidence Meter */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-jev-cyan" />
                Confidence
              </span>
              <span className="font-bold text-slate-200">{confidencePercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidencePercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  confidence >= 0.75
                    ? 'bg-gradient-to-r from-jev-cyan to-jev-green'
                    : confidence >= 0.45
                    ? 'bg-gradient-to-r from-jev-purple to-jev-cyan'
                    : 'bg-gradient-to-r from-jev-amber to-jev-red'
                }`}
              />
            </div>
          </div>

          {/* Action Probabilities Breakdown */}
          {probEntries.length > 0 && (
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex justify-between">
                <span>Top Evaluated Actions:</span>
                <span>P(Action)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {probEntries.map(([act, p]) => (
                  <div key={act} className="bg-slate-900/60 rounded px-2 py-1 flex items-center justify-between border border-slate-800">
                    <span className="text-slate-300 truncate max-w-[80px]">Action {act}</span>
                    <span className="text-jev-cyan font-semibold">{Math.round(p * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
