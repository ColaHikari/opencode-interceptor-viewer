"use client";

import { useState } from "react";

interface JsonNodeProps {
  keyName: string | number | null;
  value: unknown;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
}

function isExpandable(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value as object).length > 0;
  return false;
}

function JsonNode({ keyName, value, depth, expanded, onToggle }: JsonNodeProps) {
  const expandable = isExpandable(value);
  const indent = depth * 16;

  if (value === null) {
    return (
      <div style={{ paddingLeft: indent }} className="text-xs font-mono leading-relaxed">
        {keyName !== null && (
          <span className="text-[var(--accent)]">{`"${keyName}": `}</span>
        )}
        <span className="text-[var(--muted)]">null</span>
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <div style={{ paddingLeft: indent }} className="text-xs font-mono leading-relaxed">
        {keyName !== null && (
          <span className="text-[var(--accent)]">{`"${keyName}": `}</span>
        )}
        <span className="text-[var(--success)]">{`"${escapeHtml(value)}"`}</span>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div style={{ paddingLeft: indent }} className="text-xs font-mono leading-relaxed">
        {keyName !== null && (
          <span className="text-[var(--accent)]">{`"${keyName}": `}</span>
        )}
        <span className="text-[var(--warning)]">{value}</span>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div style={{ paddingLeft: indent }} className="text-xs font-mono leading-relaxed">
        {keyName !== null && (
          <span className="text-[var(--accent)]">{`"${keyName}": `}</span>
        )}
        <span className="text-purple-400">{String(value)}</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    const bracket = value.length === 0 ? "[]" : expanded ? "[" : "[...]";
    return (
      <div>
        <div
          style={{ paddingLeft: indent }}
          className="text-xs font-mono leading-relaxed cursor-pointer hover:text-[var(--accent)] select-none"
          onClick={expandable ? onToggle : undefined}
        >
          {expandable && (
            <span className="inline-block w-3 text-[var(--muted)]">
              {expanded ? "▾" : "▸"}
            </span>
          )}
          {keyName !== null && (
            <span className="text-[var(--accent)]">{`"${keyName}": `}</span>
          )}
          <span className="text-[var(--muted)]">{bracket}</span>
          {!expanded && (
            <span className="text-[var(--muted)]">
              {" "}{value.length} items
            </span>
          )}
        </div>
        {expanded &&
          value.map((item, idx) => (
            <JsonNodeSub
              key={idx}
              keyName={null}
              value={item}
              depth={depth + 1}
            />
          ))}
        {expanded && value.length > 0 && (
          <div style={{ paddingLeft: indent }} className="text-xs font-mono text-[var(--muted)]">
            {"]"}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    const keys = Object.keys(value as object);
    const bracket = keys.length === 0 ? "{}" : expanded ? "{" : "{...}";
    return (
      <div>
        <div
          style={{ paddingLeft: indent }}
          className="text-xs font-mono leading-relaxed cursor-pointer hover:text-[var(--accent)] select-none"
          onClick={expandable ? onToggle : undefined}
        >
          {expandable && (
            <span className="inline-block w-3 text-[var(--muted)]">
              {expanded ? "▾" : "▸"}
            </span>
          )}
          {keyName !== null && (
            <span className="text-[var(--accent)]">{`"${keyName}": `}</span>
          )}
          <span className="text-[var(--muted)]">{bracket}</span>
          {!expanded && (
            <span className="text-[var(--muted)]">
              {" "}{keys.length} keys
            </span>
          )}
        </div>
        {expanded &&
          keys.map((key) => (
            <JsonNodeSub
              key={key}
              keyName={key}
              value={(value as Record<string, unknown>)[key]}
              depth={depth + 1}
            />
          ))}
        {expanded && keys.length > 0 && (
          <div style={{ paddingLeft: indent }} className="text-xs font-mono text-[var(--muted)]">
            {"}"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: indent }} className="text-xs font-mono leading-relaxed">
      {keyName !== null && (
        <span className="text-[var(--accent)]">{`"${keyName}": `}</span>
      )}
      <span>{String(value)}</span>
    </div>
  );
}

function JsonNodeSub({
  keyName,
  value,
  depth,
}: {
  keyName: string | number | null;
  value: unknown;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 3);

  return (
    <JsonNode
      keyName={keyName}
      value={value}
      depth={depth}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function JsonViewer({ data }: { data: unknown }) {
  if (data === undefined || data === null) {
    return <div className="text-xs text-[var(--muted)]">No data</div>;
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-3 overflow-auto max-h-[60vh]">
      <JsonNodeSub keyName={null} value={data} depth={0} />
    </div>
  );
}
