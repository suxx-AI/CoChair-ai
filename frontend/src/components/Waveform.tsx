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
        return 'bg-emerald-400';
      case 'Thinking':
        return 'bg-cochair-blue-light';
      case 'Speaking':
        return 'bg-cochair-blue-bright';
      default:
        return 'bg-slate-700';
    }
  };

  const isActive = isStreamingAudio || state !== 'Idle';

  return (
    <div className="flex items-center gap-0.5 h-6 px-2 py-0.5 rounded bg-dark-850 border border-dark-800">
      {bars.map((height, i) => {
        // Calculate animation delay for wave motion
        const delay = (i * 0.08) % 1.2;
        const currentHeight = isActive
          ? Math.max(20, (height * (state === 'Thinking' ? 0.6 : 1)))
          : 25;

        return (
          <div
            key={i}
            className={`w-0.5 rounded-none transition-height duration-150 ${getColor()}`}
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
