export type AgentState = 'Idle' | 'Listening' | 'Thinking' | 'Speaking';
export type AppMode = 'normal' | 'meeting';

export interface GateEvalEvent {
  trigger: boolean;
  confidence: number;
  latency_ms: number;
}

export interface UserSpeechEvent {
  transcript: string;
  is_final: boolean;
  source?: string;
}

export interface AgentReplyEvent {
  text: string;
  timestamp?: string;
}

export interface ToolEvent {
  tool: string;
  input?: any;
  output?: any;
  row_count?: number;
  status: 'running' | 'completed' | 'error';
}

export interface ChartEvent {
  chart: {
    data: any[];
    layout: Record<string, any>;
    frames?: any[];
  };
}

export interface DatabaseStatus {
  connected: boolean;
  db_path?: string;
  tables: string[];
  row_counts: Record<string, number>;
  total_records?: number;
  error?: string;
}

export interface ConversationTurn {
  id: string;
  sender: 'user' | 'agent' | 'tool' | 'system';
  text?: string;
  toolData?: ToolEvent;
  isStreaming?: boolean;
  timestamp: string;
  category?: 'analytical' | 'banter' | 'standard';
  isSuppressed?: boolean;
  gateEval?: GateEvalEvent;
}

export interface VoiceStatus {
  is_running: boolean;
  status?: string;
  message?: string;
}
