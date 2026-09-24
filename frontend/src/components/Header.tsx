import React from 'react';
import { Mic, MicOff, Database, Activity, Users, Zap, Layers } from 'lucide-react';
import type { VoiceStatus, AppMode, GateEvalEvent } from '../types';

interface HeaderProps {
  wsConnected: boolean;
  voiceStatus: VoiceStatus | null;
  mode: AppMode;
  gateEval: GateEvalEvent | null;
  onToggleVoice: () => void;
  onToggleMode: () => void;
  onOpenSchemaModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  voiceStatus,
  mode,
  gateEval,
  onToggleVoice,
  onToggleMode,
  onOpenSchemaModal,
}) => {
  const isMeeting = mode === 'meeting';

  return (
    <header className="h-14 bg-dark-950/80 backdrop-blur-md border-b border-dark-800 px-6 flex items-center justify-between z-10">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            VOICE BI ANALYST
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 tracking-wider">
              Real-Time
            </span>
          </h1>
          <p className="text-[10px] text-slate-400">
            AssemblyAI · LangGraph · Gemini · ElevenLabs · Plotly
          </p>
        </div>
      </div>

      {/* Center / Right: Ambient Meeting HUD Metrics & Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Ambient Meeting HUD Metrics: Visible ONLY when Meeting Mode is active */}
        {isMeeting && (
          <div className="flex items-center gap-2 transition-all duration-300">
            {/* Sliding Context Window Metric */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Sliding Context (3 turns)</span>
            </div>

            {/* Gatekeeper Latency Metric Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-sans text-purple-300">Gatekeeper:</span>
              <span className="font-bold text-white">
                {gateEval ? `${gateEval.latency_ms.toFixed(0)}ms` : '<200ms'}
              </span>
              {gateEval && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-sans uppercase font-bold tracking-tight ${
                    gateEval.trigger
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700/60 text-slate-400 border border-slate-600/40'
                  }`}
                >
                  {gateEval.trigger ? 'Triggered' : 'Filtered'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Meeting Mode Toggle Button */}
        <button
          onClick={onToggleMode}
          type="button"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isMeeting
              ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20 hover:bg-purple-500/25'
              : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border-dark-700'
          }`}
          title={isMeeting ? 'Meeting Mode Active: Filtering banter & using 3-turn memory' : 'Normal Mode: 1-to-1 voice assistant'}
        >
          <Users className={`w-3.5 h-3.5 ${isMeeting ? 'text-purple-400' : 'text-slate-400'}`} />
          <span>Meeting Mode</span>

          {/* Toggle Switch Track & Thumb */}
          <div
            className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
              isMeeting ? 'bg-purple-600 justify-end' : 'bg-dark-700 justify-start'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full shadow-md transition-transform ${
                isMeeting ? 'bg-white' : 'bg-slate-400'
              }`}
            />
          </div>
        </button>

        {/* DB Schema viewer button */}
        <button
          onClick={onOpenSchemaModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-700 text-xs font-medium transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>DB Schema</span>
        </button>

        {/* Live Mic Worker Toggle */}
        <button
          onClick={onToggleVoice}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            voiceStatus?.is_running
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10'
              : 'bg-dark-800 text-slate-300 border-dark-700 hover:bg-dark-700'
          }`}
        >
          {voiceStatus?.is_running ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Mic className="w-3.5 h-3.5" />
              <span>Mic Active</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Mic Stopped</span>
            </>
          )}
        </button>

        {/* WebSocket Pulse Dot */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-dark-800">
          <span
            className={`w-2 h-2 rounded-full ${
              wsConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-mono text-slate-400">
            {wsConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
