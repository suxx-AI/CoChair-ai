import React from 'react';
import type { AgentState } from '../types';

interface WaveformProps {
  state: AgentState;
  isStreamingAudio?: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ state, isStreamingAudio }) => {
  const bars = [40, 75, 55, 90, 60, 100, 85, 45, 95, 70, 80, 50, 90, 65, 40];

  const getColor = () => {
    switch (state) {
      case 'Listening':
        return 'bg-emerald-400 shadow-emerald-500/50';
      case 'Thinking':
        return 'bg-amber-400 shadow-amber-500/50';
      case 'Speaking':
        return 'bg-purple-400 shadow-purple-500/50';
      default:
        return 'bg-slate-600 shadow-slate-600/30';
    }
  };

  const isActive = isStreamingAudio || state !== 'Idle';

  return (
    <div className="flex items-center gap-1 h-8 px-3 py-1 rounded-full bg-dark-850/80 border border-dark-700/80 shadow-inner">
      {bars.map((height, i) => {
        // Calculate animation delay for wave motion
        const delay = (i * 0.08) % 1.2;
        const currentHeight = isActive
          ? Math.max(20, (height * (state === 'Thinking' ? 0.6 : 1)))
          : 25;

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 shadow-sm ${getColor()}`}
            style={{
              height: `${currentHeight}%`,
              animation: isActive ? `wave 1.2s ease-in-out infinite` : 'none',
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};
