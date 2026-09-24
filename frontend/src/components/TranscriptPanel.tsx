import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  Database,
  Calculator,
  BarChart,
  Terminal,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2
} from 'lucide-react';
import type { ConversationTurn, AgentState } from '../types';
import { Waveform } from './Waveform';

interface TranscriptPanelProps {
  turns: ConversationTurn[];
  agentState: AgentState;
  isMicActive: boolean;
  onToggleMic: () => void;
  onSendMessage: (text: string) => void;
  onClearTurns: () => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  turns,
  agentState,
  isMicActive,
  onToggleMic,
  onSendMessage,
  onClearTurns,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [turns, agentState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const toggleToolExpand = (id: string) => {
    setExpandedTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const samplePrompts = [
    'Create a bar chart of product prices',
    'Show total orders per customer',
    'Calculate correlation between age and order counts',
    'Run ANOVA across customer age groups',
  ];

  return (
    <div className="flex flex-col h-full bg-dark-900 border border-dark-700/70 rounded-2xl overflow-hidden shadow-2xl">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-700/60 bg-dark-850/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Live Conversational Stream
              {agentState !== 'Idle' && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                    agentState === 'Listening'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                      : agentState === 'Thinking'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse'
                  }`}
                >
                  {agentState}
                </span>
              )}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Waveform Indicator */}
          <Waveform state={agentState} isStreamingAudio={isMicActive} />

          {turns.length > 0 && (
            <button
              onClick={onClearTurns}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-dark-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm font-medium text-slate-200 mb-1">Ready for queries</p>
            <p className="text-xs max-w-sm mb-6 text-slate-400">
              Speak into your microphone or try one of the suggestions below to query the database.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="text-xs text-left px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-700/80 hover:border-purple-500/40 transition-all shadow-sm"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn) => (
            <div key={turn.id} className="space-y-1">
              {/* User Message */}
              {turn.sender === 'user' && (
                <div className="flex items-start justify-end gap-2.5">
                  <div className="max-w-[82%]">
                    <div
                      className={`px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white shadow-md ${
                        turn.isStreaming
                          ? 'bg-dark-800 border border-emerald-500/50 animate-pulse'
                          : 'bg-gradient-to-r from-sky-600 to-blue-600'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{turn.text}</p>
                      {turn.isStreaming && (
                        <span className="text-[10px] text-emerald-300 flex items-center gap-1 mt-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Streaming audio...
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 text-right mt-0.5 mr-1 flex items-center justify-end gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {turn.timestamp}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                </div>
              )}

              {/* Agent Message */}
              {turn.sender === 'agent' && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                  <div className="max-w-[85%]">
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm bg-dark-850 border border-dark-700 text-slate-100 shadow-md">
                      <p className="whitespace-pre-wrap leading-relaxed">{turn.text}</p>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dark-700/60 text-[10px] text-purple-300/80">
                        <Volume2 className="w-3 h-3" />
                        <span>Spoken via ElevenLabs</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 ml-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {turn.timestamp}
                    </div>
                  </div>
                </div>
              )}

              {/* Tool Execution Card */}
              {turn.sender === 'tool' && turn.toolData && (
                <div className="my-2 ml-9 mr-4">
                  <div className="bg-dark-850/90 border border-dark-700 rounded-xl overflow-hidden shadow-sm">
                    <div
                      onClick={() => toggleToolExpand(turn.id)}
                      className="flex items-center justify-between px-3.5 py-2 cursor-pointer hover:bg-dark-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {turn.toolData.tool === 'execute_sql' && <Database className="w-3.5 h-3.5 text-emerald-400" />}
                        {turn.toolData.tool === 'correlation' && <Calculator className="w-3.5 h-3.5 text-sky-400" />}
                        {turn.toolData.tool === 't_test' && <Calculator className="w-3.5 h-3.5 text-amber-400" />}
                        {turn.toolData.tool === 'anova' && <Calculator className="w-3.5 h-3.5 text-purple-400" />}
                        {turn.toolData.tool === 'create_plot' && <BarChart className="w-3.5 h-3.5 text-rose-400" />}

                        <span className="text-xs font-mono font-semibold text-slate-300">
                          {turn.toolData.tool}
                        </span>

                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            turn.toolData.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}
                        >
                          {turn.toolData.status}
                        </span>

                        {turn.toolData.row_count !== undefined && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({turn.toolData.row_count} rows)
                          </span>
                        )}
                      </div>

                      <div className="text-slate-400">
                        {expandedTools[turn.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Tool Details / Inputs & Outputs */}
                    {expandedTools[turn.id] && (
                      <div className="p-3 bg-dark-950/70 border-t border-dark-700/80 font-mono text-xs space-y-2">
                        {turn.toolData.input?.query && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-sans mb-1">
                              Executed SQL
                            </div>
                            <pre className="p-2 rounded bg-dark-900 border border-dark-700 text-emerald-300 overflow-x-auto text-[11px]">
                              {turn.toolData.input.query}
                            </pre>
                          </div>
                        )}

                        {turn.toolData.output && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-sans mb-1">
                              Result Data
                            </div>
                            <pre className="p-2 rounded bg-dark-900 border border-dark-700 text-slate-300 overflow-x-auto text-[11px] max-h-40">
                              {JSON.stringify(turn.toolData.output, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Live Thinking Indicator */}
        {agentState === 'Thinking' && (
          <div className="flex items-center gap-2 text-xs text-amber-400 ml-9 py-1 animate-pulse">
            <Terminal className="w-3.5 h-3.5" />
            <span>Agent is executing query & statistical tools...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-3.5 border-t border-dark-700/60 bg-dark-850/40">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Mic Toggle Button */}
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicActive ? 'Mute Live Voice Engine' : 'Activate Live Voice Engine'}
            className={`p-2.5 rounded-xl border transition-all duration-300 ${
              isMicActive
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/20 animate-pulse'
                : 'bg-dark-800 text-slate-400 border-dark-700 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message or speak into your microphone..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800/90 border border-dark-700 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white shadow-md shadow-sky-600/20 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
