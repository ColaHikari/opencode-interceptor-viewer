"use client";

import { useState, useMemo } from "react";
import type { Call, MessageDiff, MessageSegment } from "@/lib/types";
import { diffMessages } from "@/lib/message-utils";
import { formatBytes, formatDuration, formatTimestamp, MD_PROSE } from "@/lib/utils";
import MessageBlock, { FoldedMessagesGroup } from "./MessageBlock";
import JsonViewer from "./JsonViewer";
import MarkdownRenderer from "./MarkdownRenderer";

type TabId = "overview" | "request" | "response" | "json-request" | "json-response";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "request", label: "Request" },
  { id: "response", label: "Response" },
  { id: "json-request", label: "JSON (Req)" },
  { id: "json-response", label: "JSON (Res)" },
];

export default function CallDetail({
  call,
  prevCall,
}: {
  call: Call;
  prevCall?: Call | null;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [responseExpanded, setResponseExpanded] = useState(false);
  const [responseViewMode, setResponseViewMode] = useState<"markdown" | "raw">("markdown");

  const diffs = useMemo(() => {
    const prev = prevCall?.request?.messages;
    const curr = call.request?.messages;
    if (!curr) return [];
    return diffMessages(prev || [], curr);
  }, [call, prevCall]);

  const segments = useMemo((): MessageSegment[] => {
    const result: MessageSegment[] = [];
    let i = 0;
    while (i < diffs.length) {
      if (diffs[i].type === "repeated") {
        const group: MessageDiff[] = [];
        const startIdx = i;
        while (i < diffs.length && diffs[i].type === "repeated") {
          group.push(diffs[i]);
          i++;
        }
        result.push({ type: "group", diffs: group, startIdx });
      } else {
        result.push({ type: "single", diff: diffs[i], diffIdx: i });
        i++;
      }
    }
    return result;
  }, [diffs]);

  const repeatedCount = diffs.filter((d) => d.type === "repeated").length;

  function renderOverview() {
    const m = call.meta;
    const rq = call.request;
    const rs = call.response;

    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card label="Status">
            <span className="text-sm font-mono">
              {m?.status != null ? m.status : "-"}
              {rs?.statusText ? ` ${rs.statusText}` : ""}
            </span>
          </Card>
          <Card label="Duration">
            <span className="text-sm font-mono">{formatDuration(m?.durationMs)}</span>
          </Card>
          <Card label="Request Size">
            <span className="text-sm font-mono">{formatBytes(m?.requestBytes)}</span>
          </Card>
          <Card label="Response Size">
            <span className="text-sm font-mono">{formatBytes(m?.responseBytes)}</span>
          </Card>
          <Card label="Model">
            <span className="text-sm font-mono">{rq?.model || "-"}</span>
          </Card>
          <Card label="Provider">
            <span className="text-sm font-mono">{call.provider}</span>
          </Card>
          <Card label="Max Tokens">
            <span className="text-sm font-mono">
              {rq?.maxTokens != null ? rq.maxTokens.toLocaleString() : "-"}
            </span>
          </Card>
          <Card label="Body Format">
            <span className="text-sm font-mono">{rs?.bodyFormat || "-"}</span>
          </Card>
        </div>

        {m?.url && (
          <Card label="URL">
            <span className="text-xs font-mono break-all">{m.url}</span>
          </Card>
        )}

        {m?.contentType && (
          <Card label="Content-Type">
            <span className="text-xs font-mono">{m.contentType}</span>
          </Card>
        )}

        {rs?.bodyReadError && (
          <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded p-3">
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide">
              Body Read Error
            </div>
            <div className="text-xs font-mono text-[var(--danger)] mt-0.5">
              {rs.bodyReadError}
            </div>
          </div>
        )}

        {rs?.bodyOmittedReason && (
          <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded p-3">
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide">
              Body Omitted
            </div>
            <div className="text-xs font-mono text-[var(--warning)] mt-0.5">
              {rs.bodyOmittedReason}
            </div>
          </div>
        )}

        {call.parseErrors.length > 0 && (
          <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded p-3">
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide">
              Parse Errors
            </div>
            {call.parseErrors.map((e, i) => (
              <div key={i} className="text-xs text-[var(--danger)] mt-0.5">
                {e.file}: {e.message}
              </div>
            ))}
          </div>
        )}

        {call.request?.tools && call.request.tools.length > 0 && (
          <Card label={`Tools (${call.request.tools.length})`}>
            <div className="flex flex-wrap gap-1 mt-1">
              {(call.request.tools as Array<{ type: string; function?: { name: string } }>).map(
                (tool, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-[var(--background)] px-1.5 py-0.5 rounded border border-[var(--border)]"
                  >
                    {tool.function?.name || `tool-${i}`}
                  </span>
                )
              )}
            </div>
          </Card>
        )}

        {diffs.length > 0 && (
          <div className="text-[10px] text-[var(--muted)]">
            {diffs.filter((d) => d.type === "new").length} new,{" "}
            {diffs.filter((d) => d.type === "modified").length} modified,{" "}
            {repeatedCount} unchanged from previous
          </div>
        )}
      </div>
    );
  }

  function renderTimestamp() {
    if (!call.timestamp) return null;
    return (
      <div className="text-[10px] text-[var(--muted)] font-mono mb-2">
        {formatTimestamp(call.timestamp)}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-[var(--border)] shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "overview" && renderOverview()}

        {activeTab === "request" && (
          <div className="p-4">
            {renderTimestamp()}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs text-[var(--muted)]">Model:</span>
              <span className="text-xs font-mono">{call.request?.model || "-"}</span>
              {call.request?.temperature != null && (
                <>
                  <span className="text-xs text-[var(--muted)]">Temp:</span>
                  <span className="text-xs font-mono">{call.request.temperature}</span>
                </>
              )}
              {call.request?.maxTokens != null && (
                <>
                  <span className="text-xs text-[var(--muted)]">Max tokens:</span>
                  <span className="text-xs font-mono">{call.request.maxTokens.toLocaleString()}</span>
                </>
              )}
            </div>

            {diffs.length === 0 ? (
              <div className="text-[var(--muted)] text-xs py-2">
                No messages in request.
              </div>
            ) : (
              <div className="space-y-2">
                {segments.map((seg) => {
                  if (seg.type === "group") {
                    const isExpanded = expandedGroups.has(seg.startIdx);
                    return (
                      <div key={`group-${seg.startIdx}`}>
                        <FoldedMessagesGroup
                          count={seg.diffs.length}
                          onToggle={() => {
                            const next = new Set(expandedGroups);
                            if (isExpanded) next.delete(seg.startIdx);
                            else next.add(seg.startIdx);
                            setExpandedGroups(next);
                          }}
                        />
                        {isExpanded &&
                          seg.diffs.map((diff, i) => (
                            <div key={i} className="mt-2">
                              <MessageBlock
                                message={diff.message}
                                diffType={diff.type}
                                prevContent={diff.prevMessage?.content}
                              />
                            </div>
                          ))}
                      </div>
                    );
                  }
                  return (
                    <MessageBlock
                      key={`single-${seg.diffIdx}`}
                      message={seg.diff.message}
                      diffType={seg.diff.type}
                      prevContent={seg.diff.prevMessage?.content}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "response" && (
          <div className="p-4">
            {renderTimestamp()}
            {call.response?.body ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() =>
                      setResponseViewMode(responseViewMode === "markdown" ? "raw" : "markdown")
                    }
                    className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--border)]/20 transition-colors"
                  >
                    {responseViewMode === "markdown" ? "Raw" : "MD"}
                  </button>
                  {call.response.body.length > 2000 && (
                    <button
                      onClick={() => setResponseExpanded(!responseExpanded)}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--border)]/20 transition-colors"
                    >
                      {responseExpanded ? "Collapse" : "Expand all"}
                    </button>
                  )}
                  <span className="text-[10px] text-[var(--muted)] font-mono">
                    {formatBytes(call.response.body.length)}
                  </span>
                </div>
                {responseViewMode === "markdown" ? (
                  <MarkdownRenderer
                    className={MD_PROSE}
                    content={
                      responseExpanded || call.response.body.length <= 2000
                        ? call.response.body
                        : call.response.body.slice(0, 2000) +
                            "\n\n*...truncated, click Expand all to view full response*"
                    }
                  />
                ) : (
                  <pre className="whitespace-pre-wrap break-words text-xs font-mono leading-relaxed max-h-96 overflow-auto text-[var(--foreground)]/80 bg-[var(--surface)] border border-[var(--border)] rounded p-3">
                    {call.response.body}
                  </pre>
                )}
              </>
            ) : (
              <div className="text-[var(--muted)] text-xs">
                {call.response?.bodyOmittedReason
                  ? `Body omitted: ${call.response.bodyOmittedReason}`
                  : call.response?.bodyReadError
                    ? `Body read error: ${call.response.bodyReadError}`
                    : "Empty response body"}
              </div>
            )}
          </div>
        )}

        {activeTab === "json-request" && (
          <div className="p-4">
            {renderTimestamp()}
            <JsonViewer data={call.request?.raw} />
          </div>
        )}

        {activeTab === "json-response" && (
          <div className="p-4">
            {renderTimestamp()}
            <JsonViewer data={call.response?.raw} />
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-3">
      <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
