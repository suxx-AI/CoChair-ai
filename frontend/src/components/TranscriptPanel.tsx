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
  Volume2,
  ShieldCheck,
  Zap,
  EyeOff,
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

  const isAcousticSuppressionActive = agentState === 'Speaking';

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
    'Can we see total sales by country from our invoices?',
    'Create a bar chart of product prices',
    'Calculate correlation between age and order counts',
    'Run ANOVA across customer age groups',
  ];

  return (
    <div className="flex flex-col h-full bg-dark-900 border border-dark-800 rounded-lg overflow-hidden">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-800 bg-dark-900">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cochair-blue-bright" />
          <h2 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            Conversation Feed
            {agentState !== 'Idle' && (
              <span className="text-[11px] text-slate-400 font-normal">
                ({agentState})
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Waveform Indicator */}
          <Waveform state={agentState} isStreamingAudio={isMicActive} />

          {turns.length > 0 && (
            <button
              onClick={onClearTurns}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors duration-150 px-2 py-1 rounded bg-dark-850 hover:bg-dark-800 border border-dark-800 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Acoustic Loop Feedback Suppression Indicator (Active during TTS output) */}
      {isAcousticSuppressionActive && (
        <div className="px-4 py-2 bg-dark-850 border-b border-dark-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cochair-blue-light" />
            <span>
              <b>Acoustic suppression active:</b> Microphone dampened during audio playback.
            </span>
          </div>
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-10 h-10 rounded-md bg-dark-850 border border-dark-800 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-cochair-blue-bright" />
            </div>
            <p className="text-sm font-semibold text-slate-200 mb-1">
              Ambient Stream Ready
            </p>
            <p className="text-xs max-w-sm mb-4 text-slate-400 leading-relaxed">
              Speak naturally. Casual banter is filtered silently, while analytical queries trigger SQL execution and visualization.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-md">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="text-xs text-left px-2.5 py-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-800 hover:border-dark-700 transition-colors duration-150"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn) => {
            const isBanter = turn.isSuppressed || turn.category === 'banter';

            return (
              <div key={turn.id} className="space-y-1">
                {/* User Speech Turn */}
                {turn.sender === 'user' && (
                  <div className="flex items-start justify-end gap-2">
                    <div className="max-w-[85%]">
                      {/* Casual Banter: Filtered / Suppressed */}
                      {isBanter ? (
                        <div className="p-3 rounded-md bg-dark-850 border border-dark-800">
                          <div className="flex items-center justify-between gap-2 mb-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-medium">
                              <EyeOff className="w-3 h-3 text-slate-500" />
                              Banter Filtered
                            </span>
                            <span className="font-mono">{turn.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {turn.text}
                          </p>
                          <div className="mt-2 pt-1 border-t border-dark-800 text-[10px] text-slate-500">
                            Intent threshold not met
                          </div>
                        </div>
                      ) : (
                        /* Analytical Dialogue: Triggered */
                        <div
                          className={`p-3 rounded-md border transition-colors duration-150 ${
                            turn.isStreaming
                              ? 'bg-dark-850 border-emerald-500/50'
                              : 'bg-dark-850 border-cochair-blue-bright/60'
                          }`}
                        >
                          {!turn.isStreaming && (
                            <div className="flex items-center justify-between gap-2 mb-1 text-[11px]">
                              <span className="flex items-center gap-1 text-cochair-blue-light font-medium">
                                <Zap className="w-3 h-3" />
                                Analytical Inquiry
                              </span>
                              {turn.gateEval && (
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {Math.round(turn.gateEval.confidence * 100)}% · {turn.gateEval.latency_ms.toFixed(0)}ms
                                </span>
                              )}
                            </div>
                          )}

                          <p className="whitespace-pre-wrap text-xs text-slate-100 font-normal leading-relaxed">{turn.text}</p>

                          {turn.isStreaming ? (
                            <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Capturing audio stream...
                            </span>
                          ) : (
                            <div className="mt-2 pt-1 border-t border-dark-800 flex items-center justify-between text-[10px] text-slate-400">
                              <span>Dispatched to SQL Agent</span>
                              <span className="font-mono">{turn.timestamp}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="w-6 h-6 rounded bg-dark-800 border border-dark-750 flex items-center justify-center shrink-0 mt-0.5 text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                {/* Agent Message */}
                {turn.sender === 'agent' && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded bg-dark-800 border border-dark-750 flex items-center justify-center shrink-0 mt-0.5 text-slate-400">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="max-w-[85%]">
                      <div className="px-3.5 py-2.5 rounded-md text-xs bg-dark-850 border border-dark-800 text-slate-200">
                        <p className="whitespace-pre-wrap leading-relaxed">{turn.text}</p>
                        <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-dark-800 text-[10px] text-slate-400">
                          <Volume2 className="w-3 h-3 text-slate-400" />
                          <span>Voice synthesis stream</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 ml-1 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {turn.timestamp}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tool Execution Card */}
                {turn.sender === 'tool' && turn.toolData && (
                  <div className="my-2 ml-8 mr-2">
                    <div className="bg-dark-850 border border-dark-800 rounded-md overflow-hidden">
                      <div
                        onClick={() => toggleToolExpand(turn.id)}
                        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-dark-800 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-2">
                          {turn.toolData.tool === 'execute_sql' && (
                            <Database className="w-3.5 h-3.5 text-cochair-blue-bright" />
                          )}
                          {turn.toolData.tool === 'correlation' && (
                            <Calculator className="w-3.5 h-3.5 text-cochair-blue-bright" />
                          )}
                          {turn.toolData.tool === 't_test' && (
                            <Calculator className="w-3.5 h-3.5 text-cochair-blue-bright" />
                          )}
                          {turn.toolData.tool === 'anova' && (
                            <Calculator className="w-3.5 h-3.5 text-cochair-blue-bright" />
                          )}
                          {turn.toolData.tool === 'create_plot' && (
                            <BarChart className="w-3.5 h-3.5 text-cochair-blue-bright" />
                          )}

                          <span className="text-xs font-mono font-medium text-slate-300">
                            {turn.toolData.tool}
                          </span>

                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-dark-750 bg-dark-900 text-slate-300 font-mono">
                            {turn.toolData.status}
                          </span>

                          {turn.toolData.row_count !== undefined && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({turn.toolData.row_count} rows)
                            </span>
                          )}
                        </div>

                        <div className="text-slate-400">
                          {expandedTools[turn.id] ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>

                      {/* Tool Details / Inputs & Outputs */}
                      {expandedTools[turn.id] && (
                        <div className="p-3 bg-dark-950 border-t border-dark-800 font-mono text-xs space-y-2">
                          {turn.toolData.input?.query && (
                            <div>
                              <div className="text-[11px] text-slate-400 mb-1">
                                SQL Query
                              </div>
                              <pre className="p-2 rounded bg-dark-900 border border-dark-800 text-slate-200 overflow-x-auto text-[11px]">
                                {turn.toolData.input.query}
                              </pre>
                            </div>
                          )}

                          {turn.toolData.output && (
                            <div>
                              <div className="text-[11px] text-slate-400 mb-1">
                                Query Result
                              </div>
                              <pre className="p-2 rounded bg-dark-900 border border-dark-800 text-slate-300 overflow-x-auto text-[11px] max-h-40">
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
            );
          })
        )}

        {/* Live Thinking Indicator */}
        {agentState === 'Thinking' && (
          <div className="flex items-center gap-2 text-xs text-slate-400 ml-8 py-1">
            <Terminal className="w-3.5 h-3.5 text-cochair-blue-bright" />
            <span>Executing SQL query & analytics tools...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 border-t border-dark-800 bg-dark-900">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Mic Toggle Button */}
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicActive ? 'Mute Speech Stream' : 'Activate Speech Stream'}
            className={`p-2 rounded-md border transition-colors duration-150 ${
              isMicActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-dark-850 text-slate-400 border-dark-800 hover:text-slate-200 hover:bg-dark-800'
            }`}
          >
            {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Speak into microphone or ask a business inquiry..."
            className="flex-1 px-3 py-2 rounded-md bg-dark-850 border border-dark-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cochair-blue transition-colors duration-150"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 rounded-md bg-cochair-blue hover:bg-cochair-blue-bright disabled:opacity-40 text-white transition-colors duration-150"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
