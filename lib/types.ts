export interface ParseError {
  file: string;
  message: string;
}

export interface CallMeta {
  url?: string;
  method?: string;
  status?: number;
  contentType?: string;
  durationMs?: number;
  requestBytes?: number;
  responseBytes?: number;
  capturedBytes?: number;
}

export interface CallRequest {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  messages?: CallMessage[];
  tools?: unknown[];
  raw: unknown;
}

export interface CallMessage {
  role: string;
  content: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
  name?: string;
}

export interface CallResponse {
  status?: number;
  statusText?: string;
  body?: string;
  bodyFormat?: string;
  bodyReadError?: string | null;
  bodyOmittedReason?: string | null;
  raw: unknown;
}

export interface Call {
  index: number;
  provider: string;
  timestamp: string;
  prefix: string;
  meta?: CallMeta;
  request?: CallRequest;
  response?: CallResponse;
  parseErrors: ParseError[];
}

export interface Session {
  id: string;
  path: string;
  calls: Call[];
}

export interface SessionSummary {
  id: string;
  path: string;
  callCount: number;
  provider: string;
  firstTimestamp: string;
  lastTimestamp: string;
  totalDurationMs: number;
  statusCodes: Record<number, number>;
  primaryBodyFormat: string;
}

export interface SearchResult {
  sessionId: string;
  callIndex: number;
  field: string;
  context: string;
}

export type MessageDiffType = "new" | "repeated" | "modified" | "unchanged";

export interface MessageDiff {
  type: MessageDiffType;
  message: CallMessage;
  prevMessage?: CallMessage;
}

export type MessageSegment =
  | { type: "single"; diff: MessageDiff; diffIdx: number }
  | { type: "group"; diffs: MessageDiff[]; startIdx: number };

export interface ToolCallArg {
  name: string;
  value: unknown;
}

export interface ParsedToolCall {
  id: string;
  type: string;
  functionName: string;
  args: ToolCallArg[];
  rawArgs: string;
}

export interface DiffLine {
  type: "same" | "added" | "removed";
  content: string;
  oldNum?: number;
  newNum?: number;
}
