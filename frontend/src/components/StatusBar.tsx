import React from 'react';
import { Database, Radio, Cpu, Activity, ShieldCheck } from 'lucide-react';
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
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            Passive Listening
          </span>
        );
      case 'Thinking':
        return (
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-cochair-blue-bright" />
            Query Processing
          </span>
        );
      case 'Speaking':
        return (
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-cochair-blue-light" />
            Voice Output Active
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-600" />
            Standby
          </span>
        );
    }
  };

  return (
    <footer className="h-9 bg-dark-950 border-t border-dark-800 px-6 flex items-center justify-between text-xs text-slate-400 select-none">
      {/* Left: Database Connection Status */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSchemaModal}
          className="flex items-center gap-2 hover:text-slate-200 transition-colors duration-150"
          title="Click to view SQLite database schema"
        >
          <Database
            className={`w-3.5 h-3.5 ${
              dbStatus?.connected ? 'text-cochair-blue-bright' : 'text-slate-500'
            }`}
          />
          <span className="font-mono text-xs text-slate-300">
            database.db
          </span>
          {dbStatus?.connected ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-dark-800 bg-dark-900 text-slate-400 font-mono">
              {dbStatus.tables.length} tables · {dbStatus.total_records ?? 26} records
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-dark-800 bg-dark-900 text-slate-400 font-mono">
              Disconnected
            </span>
          )}
        </button>

        {/* Ambient Speech Engine Telemetry */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 border-l border-dark-800 pl-4">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span>Speech Engine:</span>
          <span className="text-xs text-slate-300">
            {voiceStatus?.is_running ? 'Universal-3.5 Active' : 'Ready'}
          </span>
        </div>

        {/* Acoustic Echo Guard Telemetry */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-400 border-l border-dark-800 pl-4">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {agentState === 'Speaking' ? (
              <span className="text-slate-300 font-medium">Acoustic Suppression Active</span>
            ) : (
              <span>Echo Guard Primed</span>
            )}
          </span>
        </div>
      </div>

      {/* Center: Current Agent State */}
      <div className="flex items-center gap-2">
        <Cpu className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400 hidden sm:inline text-xs">Status:</span>
        {getAgentStateBadge()}
      </div>

      {/* Right: WebSocket Bridge Status */}
      <div className="flex items-center gap-2">
        <Radio
          className={`w-3.5 h-3.5 ${
            wsConnected ? 'text-emerald-400' : 'text-slate-500'
          }`}
        />
        <span className="text-xs text-slate-400">
          {wsConnected ? 'Event Bridge Connected' : 'Reconnecting...'}
        </span>
      </div>
    </footer>
  );
};
