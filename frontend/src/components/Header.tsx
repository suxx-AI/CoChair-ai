import React from 'react';
import {
  Mic,
  MicOff,
  Database,
  Zap,
  Layers,
  Cpu,
  Users,
} from 'lucide-react';
import { CoChairLogo } from './CoChairLogo';
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
  const isMicStreaming = Boolean(voiceStatus?.is_running);

  return (
    <header className="h-14 bg-dark-900 border-b border-dark-800 px-6 flex items-center justify-between z-20">
      {/* 1. Brand Lockup: CoChair.ai Monogram & Wordmark */}
      <div className="flex items-center gap-4">
        <CoChairLogo size="sm" showWordmark={true} />

        {/* Ambient Speech-to-Text Stream Live Indicator */}
        <div className="hidden md:flex items-center pl-4 border-l border-dark-800">
          <div
            className="flex items-center gap-2 text-xs font-medium text-slate-300"
            title={isMicStreaming ? "Ambient speech-to-text stream active and listening" : "Microphone stream paused"}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isMicStreaming ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span className="text-xs font-medium text-slate-300">
              {isMicStreaming ? 'Ambient Stream Live' : 'Stream Standby'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Clean Telemetry Badge (System Latency & Active Model Status) */}
      <div className="hidden xl:flex items-center gap-3">
        <div className="flex items-center gap-3 px-3 py-1 rounded-md bg-dark-850 border border-dark-800 text-xs text-slate-300">
          {/* Latency Telemetry */}
          <div className="flex items-center gap-1.5" title="Micro-Gatekeeper intent classifier latency">
            <Zap className="w-3.5 h-3.5 text-cochair-blue-bright" />
            <span className="text-slate-400 text-xs">Latency:</span>
            <span className="font-mono text-xs font-semibold text-slate-200">
              {gateEval?.latency_ms ? `${gateEval.latency_ms.toFixed(0)}ms` : '<180ms'}
            </span>
          </div>

          <div className="w-px h-3.5 bg-dark-750" />

          {/* Active Model Status */}
          <div className="flex items-center gap-1.5" title="Active dual-pipeline foundation models">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-xs">Model:</span>
            <span className="text-xs text-slate-200">
              Deepseek V4-Flash · Universal-3.5
            </span>
          </div>
        </div>

        {/* Ambient Meeting Mode Badges (When Meeting Mode is active) */}
        {isMeeting && (
          <div className="flex items-center gap-2">
            {/* Sliding Context Buffer Metric */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-dark-850 border border-dark-800 text-slate-300 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Context Buffer: 3 turns</span>
            </div>

            {/* Gatekeeper Evaluation Tag */}
            {gateEval && (
              <span
                className={`text-xs px-2 py-0.5 rounded border font-medium ${
                  gateEval.trigger
                    ? 'bg-cochair-blue/15 text-cochair-blue-light border-cochair-blue/30'
                    : 'bg-dark-850 text-slate-400 border-dark-800'
                }`}
              >
                {gateEval.trigger ? 'Triggered' : 'Banter Suppressed'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Operational Controls */}
      <div className="flex items-center gap-2">
        {/* Meeting Mode Toggle Button */}
        <button
          onClick={onToggleMode}
          type="button"
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors duration-150 ${
            isMeeting
              ? 'bg-dark-800 text-slate-100 border-cochair-blue-bright/60'
              : 'bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-slate-200 border-dark-800'
          }`}
          title={isMeeting ? 'Meeting Mode Active: Filtering banter & sliding context active' : 'Normal Mode: 1-to-1 Voice Assistant'}
        >
          <Users className={`w-3.5 h-3.5 ${isMeeting ? 'text-cochair-blue-light' : 'text-slate-400'}`} />
          <span>Meeting Mode</span>

          {/* Toggle Switch Track & Thumb */}
          <div
            className={`w-6 h-3.5 flex items-center rounded-full p-0.5 transition-colors ${
              isMeeting ? 'bg-cochair-blue justify-end' : 'bg-dark-700 justify-start'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>
        </button>

        {/* Database Schema viewer button */}
        <button
          onClick={onOpenSchemaModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-dark-800 text-xs font-medium transition-colors duration-150"
          title="Inspect SQLite Database Schema"
        >
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">DB Schema</span>
        </button>

        {/* Live Mic Worker Toggle */}
        <button
          onClick={onToggleVoice}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors duration-150 ${
            isMicStreaming
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-dark-850 text-slate-300 border-dark-800 hover:bg-dark-800'
          }`}
          title={isMicStreaming ? 'Stop Audio Capture' : 'Start Audio Capture'}
        >
          {isMicStreaming ? (
            <>
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mic Active</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Mic Off</span>
            </>
          )}
        </button>

        {/* WebSocket Connection Indicator */}
        <div className="flex items-center gap-2 pl-3 border-l border-dark-800">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              wsConnected ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
          <span className="text-xs text-slate-400 hidden sm:inline">
            {wsConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
