"use client";

import { useState } from "react";
import type { ParsedToolCall } from "@/lib/types";
import { parseToolCalls } from "@/lib/message-utils";

export default function ToolCallView({ rawToolCalls }: { rawToolCalls: unknown[] }) {
  const calls = parseToolCalls(rawToolCalls);
  if (calls.length === 0) return null;

  return (
    <div className="mt-2 border-t border-[var(--border)] pt-2">
      <div className="text-[10px] text-[var(--muted)] mb-1.5 font-medium">
        Tool calls ({calls.length})
      </div>
      <div className="space-y-2">
        {calls.map((call, i) => (
          <ToolCallItem key={call.id || i} call={call} index={i} />
        ))}
      </div>
    </div>
  );
}

function ToolCallItem({ call, index }: { call: ParsedToolCall; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[var(--border)] rounded overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)]/30 transition-colors flex items-center gap-2"
      >
        <span className="text-[10px] text-[var(--muted)]">{index + 1}.</span>
        <span className="text-xs font-mono text-[var(--accent)]">
          {call.functionName}
        </span>
        {call.args.length > 0 && (
          <span className="text-[10px] text-[var(--muted)] truncate flex-1">
            {call.args
              .slice(0, 3)
              .map((a) => `${a.name}: ${formatArgPreview(a.value)}`)
              .join(", ")}
          </span>
        )}
        <span className="text-[10px] text-[var(--muted)] ml-auto">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="px-3 py-2 border-t border-[var(--border)]">
          {call.args.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-[var(--muted)] mb-1">
                Arguments
              </div>
              <div className="space-y-1">
                {call.args.map((arg) => (
                  <div key={arg.name} className="flex gap-2 text-xs">
                    <span className="text-[var(--accent)] font-mono shrink-0">
                      {arg.name}
                    </span>
                    <span className="text-[var(--muted)]">=</span>
                    <code className="text-xs bg-[var(--background)] px-1.5 py-0.5 rounded break-all flex-1">
                      {formatArgValue(arg.value)}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-[10px] text-[var(--muted)] font-mono">
            id: {call.id}
          </div>
        </div>
      )}
    </div>
  );
}

function formatArgPreview(value: unknown): string {
  if (typeof value === "string") {
    if (value.length > 60) return value.slice(0, 60) + "...";
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "...";
}

function formatArgValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}
