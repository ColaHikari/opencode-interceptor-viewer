import * as fs from "fs";
import * as path from "path";
import {
  Call,
  CallMeta,
  CallRequest,
  CallResponse,
  CallMessage,
  ParseError,
  Session,
  SessionSummary,
  SearchResult,
} from "./types";

function getBaseDir(): string {
  return process.env.INTERCEPTOR_DATA_DIR || path.join("/tmp", "opencode-interceptor");
}

export function listSessionDirs(baseDir?: string): string[] {
  const dir = baseDir || getBaseDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("ses_"))
    .map((d) => path.join(dir, d.name))
    .sort();
}

function getFileType(filename: string): "meta" | "request" | "response" | null {
  if (filename.endsWith(".meta.json")) return "meta";
  if (filename.endsWith(".request.json")) return "request";
  if (filename.endsWith(".response.json")) return "response";
  return null;
}

function extractPrefix(filename: string): string | null {
  const match = filename.match(/^(\d{3}-)/);
  return match ? match[1] : null;
}

function extractIndex(filename: string): number {
  const match = filename.match(/^(\d{3})-/);
  return match ? parseInt(match[1], 10) : 0;
}

function extractProvider(filename: string): string {
  const match = filename.match(/^\d{3}-([^-]+)/);
  return match ? match[1] : "unknown";
}

function extractTimestamp(filename: string): string {
  const match = filename.match(/^\d{3}-[^-]+-(.+)\.(meta|request|response)\.json$/);
  return match ? match[1] : "";
}

function safeParse<T>(filePath: string): { data: T | null; error: string | null } {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return { data: JSON.parse(raw), error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { data: null, error: msg };
  }
}

function normalizeMeta(raw: unknown): CallMeta {
  if (!raw || typeof raw !== "object") return {};
  const m = raw as Record<string, unknown>;
  return {
    url: typeof m.url === "string" ? m.url : undefined,
    method: typeof m.method === "string" ? m.method : undefined,
    status: typeof m.status === "number" ? m.status : undefined,
    contentType: typeof m.contentType === "string" ? m.contentType : undefined,
    durationMs: typeof m.durationMs === "number" ? m.durationMs : undefined,
    requestBytes: typeof m.requestBytes === "number" ? m.requestBytes : undefined,
    responseBytes: typeof m.responseBytes === "number" ? m.responseBytes : undefined,
    capturedBytes: typeof m.capturedBytes === "number" ? m.capturedBytes : undefined,
  };
}

function normalizeMessages(raw: unknown): CallMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((msg: Record<string, unknown>) => ({
    role: typeof msg.role === "string" ? msg.role : "",
    content:
      typeof msg.content === "string"
        ? msg.content
        : msg.content != null
          ? JSON.stringify(msg.content)
          : "",
    tool_calls: Array.isArray(msg.tool_calls) ? msg.tool_calls : undefined,
    tool_call_id: typeof msg.tool_call_id === "string" ? msg.tool_call_id : undefined,
    name: typeof msg.name === "string" ? msg.name : undefined,
  }));
}

function normalizeRequest(raw: unknown): CallRequest {
  if (!raw || typeof raw !== "object") return { raw };
  const r = raw as Record<string, unknown>;
  const body = (r.body || r) as Record<string, unknown>;
  return {
    model: typeof body.model === "string" ? body.model : undefined,
    maxTokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
    temperature: typeof body.temperature === "number" ? body.temperature : undefined,
    topP: typeof body.top_p === "number" ? body.top_p : undefined,
    messages: normalizeMessages(body.messages),
    tools: Array.isArray(body.tools) ? body.tools : undefined,
    raw,
  };
}

function normalizeResponse(raw: unknown): CallResponse {
  if (!raw || typeof raw !== "object") return { raw };
  const r = raw as Record<string, unknown>;
  return {
    status: typeof r.status === "number" ? r.status : undefined,
    statusText: typeof r.statusText === "string" ? r.statusText : undefined,
    body: typeof r.body === "string" ? r.body : undefined,
    bodyFormat: typeof r.bodyFormat === "string" ? r.bodyFormat : undefined,
    bodyReadError:
      r.bodyReadError === null
        ? null
        : typeof r.bodyReadError === "string"
          ? r.bodyReadError
          : undefined,
    bodyOmittedReason:
      r.bodyOmittedReason === null
        ? null
        : typeof r.bodyOmittedReason === "string"
          ? r.bodyOmittedReason
          : undefined,
    raw,
  };
}

export function parseSession(sessionPath: string): Session | null {
  const dirName = path.basename(sessionPath);
  let files: string[];
  try {
    files = fs.readdirSync(sessionPath).filter((f) => f.endsWith(".json"));
  } catch {
    return null;
  }

  const groups = new Map<string, { meta?: string; request?: string; response?: string; prefix: string; index: number; provider: string; timestamp: string }>();

  for (const file of files) {
    const type = getFileType(file);
    if (!type) continue;

    const prefix = extractPrefix(file);
    if (!prefix) continue;

    if (!groups.has(prefix)) {
      groups.set(prefix, {
        prefix,
        index: extractIndex(file),
        provider: extractProvider(file),
        timestamp: extractTimestamp(file),
      });
    }

    const group = groups.get(prefix)!;
    group[type] = path.join(sessionPath, file);
  }

  const calls: Call[] = [];

  for (const [, group] of groups) {
    const parseErrors: ParseError[] = [];
    let meta: CallMeta | undefined;
    let request: CallRequest | undefined;
    let response: CallResponse | undefined;

    if (group.meta) {
      const { data, error } = safeParse<Record<string, unknown>>(group.meta);
      if (error) {
        parseErrors.push({ file: path.basename(group.meta), message: error });
      } else {
        meta = normalizeMeta(data);
      }
    }

    if (group.request) {
      const { data, error } = safeParse<Record<string, unknown>>(group.request);
      if (error) {
        parseErrors.push({ file: path.basename(group.request), message: error });
      } else {
        request = normalizeRequest(data);
      }
    }

    if (group.response) {
      const { data, error } = safeParse<Record<string, unknown>>(group.response);
      if (error) {
        parseErrors.push({ file: path.basename(group.response), message: error });
      } else {
        response = normalizeResponse(data);
      }
    }

    calls.push({
      index: group.index,
      provider: group.provider,
      timestamp: group.timestamp,
      prefix: group.prefix,
      meta,
      request,
      response,
      parseErrors,
    });
  }

  calls.sort((a, b) => a.index - b.index);

  return {
    id: dirName,
    path: sessionPath,
    calls,
  };
}

export function getSessionSummary(sessionPath: string): SessionSummary | null {
  const session = parseSession(sessionPath);
  if (!session || session.calls.length === 0) return null;

  const calls = session.calls;
  const statusCodes: Record<number, number> = {};
  const provider = calls[0].provider;
  let totalDurationMs = 0;
  const bodyFormats: Record<string, number> = {};

  for (const call of calls) {
    if (call.meta?.status != null) {
      statusCodes[call.meta.status] = (statusCodes[call.meta.status] || 0) + 1;
    }
    if (call.meta?.durationMs) {
      totalDurationMs += call.meta.durationMs;
    }
    if (call.response?.bodyFormat) {
      bodyFormats[call.response.bodyFormat] = (bodyFormats[call.response.bodyFormat] || 0) + 1;
    }
  }

  let primaryBodyFormat = "unknown";
  let maxCount = 0;
  for (const [fmt, count] of Object.entries(bodyFormats)) {
    if (count > maxCount) {
      maxCount = count;
      primaryBodyFormat = fmt;
    }
  }

  return {
    id: session.id,
    path: session.path,
    callCount: calls.length,
    provider,
    firstTimestamp: calls[0].timestamp,
    lastTimestamp: calls[calls.length - 1].timestamp,
    totalDurationMs,
    statusCodes,
    primaryBodyFormat,
  };
}

export function searchSessions(
  baseDir: string | undefined,
  query: string
): SearchResult[] {
  const dirs = listSessionDirs(baseDir);
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const dir of dirs) {
    const session = parseSession(dir);
    if (!session) continue;

    for (const call of session.calls) {
      if (call.meta?.url && call.meta.url.toLowerCase().includes(lowerQuery)) {
        results.push({
          sessionId: session.id,
          callIndex: call.index,
          field: "url",
          context: call.meta.url,
        });
      }

      if (call.request?.model && call.request.model.toLowerCase().includes(lowerQuery)) {
        results.push({
          sessionId: session.id,
          callIndex: call.index,
          field: "model",
          context: call.request.model,
        });
      }

      if (call.request?.messages) {
        for (const msg of call.request.messages) {
          if (msg.content && msg.content.toLowerCase().includes(lowerQuery)) {
            const snippet = msg.content.length > 200 ? msg.content.slice(0, 200) + "..." : msg.content;
            results.push({
              sessionId: session.id,
              callIndex: call.index,
              field: `message[${msg.role}]`,
              context: snippet,
            });
          }
        }
      }

      if (call.response?.body && call.response.body.toLowerCase().includes(lowerQuery)) {
        const snippet =
          call.response.body.length > 200
            ? call.response.body.slice(0, 200) + "..."
            : call.response.body;
        results.push({
          sessionId: session.id,
          callIndex: call.index,
          field: "response",
          context: snippet,
        });
      }
    }
  }

  return results;
}
