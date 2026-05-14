"use client";

import { useState } from "react";
import type { CallMessage, MessageDiffType } from "@/lib/types";
import { MD_PROSE } from "@/lib/utils";
import ToolCallView from "./ToolCallView";
import DiffView from "./DiffView";
import MarkdownRenderer from "./MarkdownRenderer";

interface Props {
  message: CallMessage;
  diffType: MessageDiffType;
  prevContent?: string;
}

const ROLE_COLORS: Record<string, string> = {
  system: "bg-amber-400/80",
  developer: "bg-amber-400/80",
  user: "bg-[var(--accent)]",
  assistant: "bg-[var(--success)]",
  tool: "bg-purple-400",
};

const ROLE_LABELS: Record<string, string> = {
  system: "System",
  developer: "Developer",
  user: "User",
  assistant: "Assistant",
  tool: "Tool",
};

const DIFF_LABELS: Record<MessageDiffType, { text: string; cls: string }> = {
  new: { text: "New", cls: "bg-[var(--success)]/20 text-[var(--success)]" },
  repeated: { text: "", cls: "" },
  modified: { text: "Modified", cls: "bg-[var(--warning)]/20 text-[var(--warning)]" },
  unchanged: { text: "", cls: "" },
};

type ViewMode = "markdown" | "raw";

function getDefaultViewMode(role: string, hasToolCalls: boolean): ViewMode {
  if (role === "assistant" && !hasToolCalls) return "markdown";
  if (role === "assistant" && hasToolCalls) return "raw";
  if (role === "tool") return "raw";
  return "markdown";
}

export default function MessageBlock({ message, diffType, prevContent }: Props) {
  const [expanded, setExpanded] = useState(diffType === "new" || diffType === "modified");
  const [showPrev, setShowPrev] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getDefaultViewMode(
      message.role,
      Array.isArray(message.tool_calls) && message.tool_calls.length > 0
    )
  );

  const role = message.role;
  const isSystem = role === "system" || role === "developer";
  const isTool = role === "tool";
  const isAssistant = role === "assistant";
  const hasToolCalls = isAssistant && Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
  const isLong = (message.content?.length || 0) > 500;
  const shouldFold = !expanded && (isSystem || isTool || isLong) && diffType !== "new";
  const displayContent = shouldFold
    ? message.content.slice(0, 300) + "..."
    : message.content;

  const diffLabel = DIFF_LABELS[diffType];

  return (
    <div className="border border-[var(--border)] rounded overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface)] gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`inline-block w-2 h-2 rounded-full shrink-0 ${ROLE_COLORS[role] || "bg-[var(--muted)]"}`}
          />
          <span className="text-xs font-semibold whitespace-nowrap">
            {ROLE_LABELS[role] || role}
          </span>
          {message.name && (
            <span className="text-[10px] text-[var(--muted)]">
              ({message.name})
            </span>
          )}
          {message.tool_call_id && (
            <span className="text-[10px] text-[var(--muted)] font-mono break-all">
              [{message.tool_call_id}]
            </span>
          )}
          {hasToolCalls && (
            <span className="text-[10px] text-purple-400 font-medium">
              {(message.tool_calls as unknown[]).length} call(s)
            </span>
          )}
          {diffLabel.text && (
            <span className={`text-[10px] px-1 rounded ${diffLabel.cls}`}>
              {diffLabel.text}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {diffType === "modified" && prevContent != null && (
            <button
              onClick={() => setShowPrev(!showPrev)}
              className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--border)]/20 transition-colors"
            >
              {showPrev ? "Hide diff" : "Diff"}
            </button>
          )}
          {displayContent && (
            <button
              onClick={() =>
                setViewMode(viewMode === "markdown" ? "raw" : "markdown")
              }
              className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--border)]/20 transition-colors"
            >
              {viewMode === "markdown" ? "Raw" : "MD"}
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--border)]/20 transition-colors"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* content */}
      {expanded && (
        <div className="border-t border-[var(--border)]">
          {viewMode === "markdown" ? (
            <MarkdownRenderer className={MD_PROSE} content={displayContent} />
          ) : (
            <pre className="px-3 py-2 whitespace-pre-wrap break-words text-xs font-mono leading-relaxed max-h-96 overflow-auto text-[var(--foreground)]/80">
              {displayContent}
            </pre>
          )}
        </div>
      )}

      {/* tool calls for assistant messages */}
      {expanded && hasToolCalls && (
        <div className="border-t border-[var(--border)] px-3 pb-2">
          <ToolCallView rawToolCalls={message.tool_calls as unknown[]} />
        </div>
      )}

      {/* diff view for modified messages */}
      {expanded && showPrev && prevContent != null && (
        <div className="border-t border-[var(--border)]">
          <DiffView oldText={prevContent} newText={message.content} />
        </div>
      )}
    </div>
  );
}

interface FoldedGroupProps {
  count: number;
  onToggle: () => void;
}

export function FoldedMessagesGroup({ count, onToggle }: FoldedGroupProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left px-3 py-2 border border-dashed border-[var(--border)] rounded-lg text-xs text-[var(--muted)] hover:bg-[var(--surface)] hover:border-[var(--accent)]/30 transition-all"
    >
      <span className="font-medium">{count}</span> repeated message{count > 1 ? "s" : ""} from previous call
    </button>
  );
}
