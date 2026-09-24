import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TranscriptPanel } from './components/TranscriptPanel';
import { ChartView } from './components/ChartView';
import { StatusBar } from './components/StatusBar';
import { SchemaModal } from './components/SchemaModal';
import type {
  AgentState,
  DatabaseStatus,
  VoiceStatus,
  ConversationTurn,
  ChartEvent,
  AppMode,
  GateEvalEvent,
} from './types';

const WS_URL = 'ws://localhost:8000/ws';
const API_URL = 'http://localhost:8000';

export function App() {
  const [wsConnected, setWsConnected] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('Idle');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const [mode, setMode] = useState<AppMode>('normal');
  const [gateEval, setGateEval] = useState<GateEvalEvent | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [currentChart, setCurrentChart] = useState<ChartEvent['chart'] | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const modeRef = useRef<AppMode>('normal');
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // WebSocket Connection Lifecycle
  useEffect(() => {
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          console.log('[WS] Connected to backend event bridge');
          setWsConnected(true);
          try {
            ws.send(JSON.stringify({ type: 'set_mode', mode: modeRef.current }));
          } catch (e) {
            console.warn('Failed to send initial mode:', e);
          }
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const payload = JSON.parse(event.data);
            const { id, type, data } = payload;

            // Deduplicate events by unique broadcast ID
            if (id) {
              if (seenEventIdsRef.current.has(id)) {
                return;
              }
              seenEventIdsRef.current.add(id);
              if (seenEventIdsRef.current.size > 200) {
                const first = seenEventIdsRef.current.values().next().value;
                if (first) seenEventIdsRef.current.delete(first);
              }
            }

            switch (type) {
              case 'connection_status':
                setWsConnected(true);
                break;

              case 'db_status':
                setDbStatus(data);
                break;

              case 'voice_status':
                setVoiceStatus(data);
                break;

              case 'mode_status':
                if (data?.mode === 'meeting' || data?.mode === 'normal') {
                  setMode(data.mode);
                }
                break;

              case 'gate_eval':
                console.log('[WS] Received gate_eval event:', data);
                if (data) {
                  setGateEval({
                    trigger: Boolean(data.trigger),
                    confidence: Number(data.confidence ?? 0),
                    latency_ms: Number(data.latency_ms ?? 0),
                  });
                }
                break;

              case 'agent_state':
                if (data?.state) {
                  setAgentState(data.state);
                }
                break;

              case 'user_speech': {
                const text = data?.transcript?.trim();
                if (!text) break;
                const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                setTurns((prev) => {
                  const last = prev[prev.length - 1];

                  // Prevent exact duplicates
                  if (last && last.sender === 'user' && last.text === text) {
                    if (last.isStreaming && data.is_final) {
                      return [
                        ...prev.slice(0, -1),
                        { ...last, isStreaming: false, timestamp: now },
                      ];
                    }
                    return prev;
                  }

                  // If previous turn was interim user speech, replace it
                  if (last && last.sender === 'user' && last.isStreaming) {
                    return [
                      ...prev.slice(0, -1),
                      { ...last, text: text, isStreaming: !data.is_final, timestamp: now },
                    ];
                  } else {
                    return [
                      ...prev,
                      {
                        id: `user-${Date.now()}-${Math.random()}`,
                        sender: 'user',
                        text: text,
                        isStreaming: !data.is_final,
                        timestamp: now,
                      },
                    ];
                  }
                });
                break;
              }

              case 'agent_reply': {
                const replyText = data?.text?.trim();
                if (!replyText) break;
                const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                setTurns((prev) => {
                  const last = prev[prev.length - 1];
                  if (last && last.sender === 'agent' && last.text === replyText) {
                    return prev;
                  }
                  return [
                    ...prev,
                    {
                      id: `agent-${Date.now()}-${Math.random()}`,
                      sender: 'agent',
                      text: replyText,
                      timestamp: now,
                    },
                  ];
                });
                break;
              }

              case 'tool_event':
                if (data) {
                  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  setTurns((prev) => [
                    ...prev,
                    {
                      id: `tool-${Date.now()}-${Math.random()}`,
                      sender: 'tool',
                      toolData: data,
                      timestamp: now,
                    },
                  ]);
                }
                break;

              case 'render_plot':
              case 'chart_update':
                console.log('[WS] Received chart update:', data);
                if (data?.chart) {
                  setCurrentChart(data.chart);
                } else if (data?.data && data?.layout) {
                  setCurrentChart(data);
                }
                break;

              default:
                break;
            }
          } catch (err) {
            console.error('[WS] Error parsing message:', err);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          console.log('[WS] Disconnected, scheduling reconnect...');
          setWsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connect, 2500);
        };

        ws.onerror = (err) => {
          console.warn('[WS] WebSocket error:', err);
          ws.close();
        };
      } catch (e) {
        console.error('[WS] Failed to create WebSocket:', e);
        if (!isUnmounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    // Fetch initial db status via REST fallback
    fetch(`${API_URL}/api/db/status`)
      .then((res) => res.json())
      .then((data) => {
        if (!isUnmounted) setDbStatus(data);
      })
      .catch((err) => console.warn('Could not fetch DB status:', err));

    fetch(`${API_URL}/api/voice/status`)
      .then((res) => res.json())
      .then((data) => {
        if (!isUnmounted) setVoiceStatus(data);
      })
      .catch((err) => console.warn('Could not fetch Voice status:', err));

    fetch(`${API_URL}/api/mode`)
      .then((res) => res.json())
      .then((data) => {
        if (!isUnmounted && (data.mode === 'meeting' || data.mode === 'normal')) {
          setMode(data.mode);
        }
      })
      .catch((err) => console.warn('Could not fetch mode status:', err));

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Toggle Meeting Mode vs Normal Mode
  const handleToggleMode = () => {
    const nextMode: AppMode = mode === 'meeting' ? 'normal' : 'meeting';
    setMode(nextMode);

    const eventPayload = {
      type: 'set_mode',
      mode: nextMode,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(eventPayload));
      console.log('[WS] Sent set_mode event:', eventPayload);
    }

    // REST fallback sync
    fetch(`${API_URL}/api/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: nextMode }),
    }).catch((err) => console.warn('Could not sync mode via REST:', err));
  };

  // Send query directly through API
  const handleSendMessage = async (text: string) => {
    try {
      setAgentState('Thinking');
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, speak_audio: false }),
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
      setAgentState('Idle');
    }
  };

  // Toggle Voice Engine background worker
  const handleToggleVoice = async () => {
    try {
      const endpoint = voiceStatus?.is_running ? '/api/voice/stop' : '/api/voice/start';
      const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST' });
      const data = await res.json();
      setVoiceStatus({
        is_running: data.is_running ?? false,
      });
    } catch (err) {
      console.error('Error toggling voice engine:', err);
    }
  };

  // Load sample demonstration chart
  const handleLoadSampleChart = () => {
    const samplePayload: ChartEvent['chart'] = {
      data: [
        {
          type: 'bar',
          x: ['Laptop', 'Headphones', 'Keyboard', 'Desk', 'Chair'],
          y: [950, 120, 80, 300, 180],
          marker: {
            color: ['#38bdf8', '#818cf8', '#a855f7', '#34d399', '#f43f5e'],
          },
        },
      ],
      layout: {
        title: { text: 'Sample Product Price Catalog ($)' },
        xaxis: { title: 'Product Name' },
        yaxis: { title: 'Price (USD)' },
      },
    };
    setCurrentChart(samplePayload);
  };

  const handleClearTurns = () => {
    setTurns([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-dark-950 text-slate-100 overflow-hidden select-none">
      {/* Top Header */}
      <Header
        wsConnected={wsConnected}
        voiceStatus={voiceStatus}
        mode={mode}
        gateEval={gateEval}
        onToggleVoice={handleToggleVoice}
        onToggleMode={handleToggleMode}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
      />

      {/* Main Content Viewports */}
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        {/* Left / Center Panel: Live Transcript & Voice Waveform */}
        <section className="flex-1 h-full min-h-0 md:max-w-[48%]">
          <TranscriptPanel
            turns={turns}
            agentState={agentState}
            isMicActive={voiceStatus?.is_running ?? false}
            onToggleMic={handleToggleVoice}
            onSendMessage={handleSendMessage}
            onClearTurns={handleClearTurns}
          />
        </section>

        {/* Right Panel: Interactive Plotly Chart Viewport */}
        <section className="flex-1 h-full min-h-0 md:max-w-[52%]">
          <ChartView
            chart={currentChart}
            onLoadSampleChart={handleLoadSampleChart}
          />
        </section>
      </main>

      {/* Bottom Status Bar */}
      <StatusBar
        wsConnected={wsConnected}
        agentState={agentState}
        dbStatus={dbStatus}
        voiceStatus={voiceStatus}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
      />

      {/* Schema Inspection Modal */}
      <SchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        dbStatus={dbStatus}
      />
    </div>
  );
}

export default App;
