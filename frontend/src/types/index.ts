// ============================================================
// VELA — Type Definitions
// ============================================================

export interface User {
  id: string;
  email: string;
  display_name?: string;
  role_preference?: string;
  skills?: string[];
  resume_text?: string;
  career_notes?: Record<string, unknown>;
  tracked_companies?: string[];
  created_at: string;
  updated_at: string;
}

export interface ConnectorInfo {
  name: string;
  display_name: string;
  description: string;
  icon: string;
  tables: string[];
  status: "connected" | "disconnected" | "error" | "connecting";
  always_connected?: boolean;
}

export interface SourceConnection {
  id: string;
  user_id: string;
  source_type: string;
  status: string;
  tables_available: string[];
  connected_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isError?: boolean;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface GraphNodeData {
  id: string;
  type: "query" | "claude" | "tool_call" | "synthesis" | "answer" | "error";
  label: string;
  status: "running" | "complete" | "error";
  source_name?: string;
  table_name?: string;
  row_count?: number;
  sql_query?: string;
  latency_ms?: number;
  error_message?: string;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export type SSEEventType =
  | "graph_node"
  | "graph_edge"
  | "answer_chunk"
  | "done"
  | "error";

export interface SSEEvent {
  type: SSEEventType;
  data: GraphNodeData | GraphEdgeData | { text: string } | { message: string };
}

export interface AskRequest {
  user_id: string;
  message: string;
  conversation_id?: string;
}

export interface AskResponse {
  conversation_id: string;
  status: string;
}

export interface APIError {
  error: string;
  message: string;
  suggestion?: string;
}

export interface UserMemory {
  id: string;
  user_id: string;
  memory_type: string;
  content: Record<string, unknown>;
  created_at: string;
}

export interface TrackedApplication {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  applied_date: string;
  notes?: string;
  last_email_date?: string;
}
