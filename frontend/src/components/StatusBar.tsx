import React from 'react';
import { Database, Radio, Cpu, Activity } from 'lucide-react';
import type { AgentState, DatabaseStatus, VoiceStatus } from '../types';

interface StatusBarProps {
  wsConnected: boolean;
  agentState: AgentState;
  dbStatus: DatabaseStatus | null;
  voiceStatus: VoiceStatus | null;
  onOpenSchemaModal: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  wsConnected,
  agentState,
  dbStatus,
  voiceStatus,
  onOpenSchemaModal,
}) => {
  const getAgentStateBadge = () => {
    switch (agentState) {
      case 'Listening':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Listening
          </span>
        );
      case 'Thinking':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin" />
            Thinking
          </span>
        );
      case 'Speaking':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Speaking
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Idle
          </span>
        );
    }
  };

  return (
    <footer className="h-10 bg-dark-950 border-t border-dark-800 px-5 flex items-center justify-between text-xs text-slate-400 select-none">
      {/* Left: Database Connection Status */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSchemaModal}
          className="flex items-center gap-2 hover:text-slate-200 transition-colors group"
          title="Click to view database schema"
        >
          <Database
            className={`w-3.5 h-3.5 ${
              dbStatus?.connected ? 'text-emerald-400' : 'text-rose-400'
            }`}
          />
          <span className="font-mono text-[11px] text-slate-300 group-hover:underline">
            database.db
          </span>
          {dbStatus?.connected ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {dbStatus.tables.length} tables · {dbStatus.total_records ?? 26} records
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
              Disconnected
            </span>
          )}
        </button>

        {/* Voice Background Worker Status */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>Mic Engine:</span>
          <span
            className={`font-mono text-[11px] ${
              voiceStatus?.is_running ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {voiceStatus?.is_running ? 'Streaming' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Center: Current Agent State */}
      <div className="flex items-center gap-2">
        <Cpu className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400 hidden sm:inline">Agent State:</span>
        {getAgentStateBadge()}
      </div>

      {/* Right: WebSocket Bridge Status */}
      <div className="flex items-center gap-2">
        <Radio
          className={`w-3.5 h-3.5 ${
            wsConnected ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
          }`}
        />
        <span className="font-mono text-[11px]">
          {wsConnected ? 'WebSocket Live' : 'Reconnecting...'}
        </span>
      </div>
    </footer>
  );
};
