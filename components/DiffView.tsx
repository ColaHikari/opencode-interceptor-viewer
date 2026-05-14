"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { computeDiff } from "@/lib/message-utils";
import type { DiffLine } from "@/lib/types";

function groupHunks(lines: DiffLine[]): number[][] {
  const hunks: number[][] = [];
  let current: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type !== "same") {
      current.push(i);
    } else if (current.length > 0) {
      hunks.push(current);
      current = [];
    }
  }
  if (current.length > 0) hunks.push(current);
  return hunks;
}

export default function DiffView({
  oldText,
  newText,
}: {
  oldText: string;
  newText: string;
}) {
  const lines = useMemo(() => computeDiff(oldText, newText), [oldText, newText]);
  const hunks = useMemo(() => groupHunks(lines), [lines]);
  const [activeHunk, setActiveHunk] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToHunk = useCallback(
    (hunkIdx: number) => {
      const el = containerRef.current;
      if (!el || hunks.length === 0) return;
      const idx = Math.max(0, Math.min(hunkIdx, hunks.length - 1));
      const firstLine = hunks[idx][0];
      const lineEl = el.children[firstLine] as HTMLElement | undefined;
      lineEl?.scrollIntoView({ block: "center", behavior: "smooth" });
      setActiveHunk(idx);
    },
    [hunks]
  );

  if (lines.length === 0) {
    return (
      <div className="text-[10px] text-[var(--muted)] py-1">No differences.</div>
    );
  }

  const addedCount = lines.filter((l) => l.type === "added").length;
  const removedCount = lines.filter((l) => l.type === "removed").length;
  const activeLines = new Set(hunks[activeHunk] || []);

  return (
    <div className="border border-[var(--border)] rounded overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1 bg-[var(--surface)] border-b border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted)]">
          Diff:{" "}
          <span className="text-[var(--success)]">+{addedCount}</span>
          {" / "}
          <span className="text-[var(--danger)]">-{removedCount}</span>
        </span>

        {hunks.length > 0 && (
          <div className="flex items-center gap-0.5 ml-auto">
            <button
              onClick={() => scrollToHunk(activeHunk - 1)}
              disabled={activeHunk <= 0}
              className="text-[10px] text-[var(--accent)] hover:underline disabled:text-[var(--muted)]/30 disabled:no-underline px-1"
            >
              ▲ Prev
            </button>
            <span className="text-[10px] text-[var(--muted)]">
              {activeHunk + 1}/{hunks.length}
            </span>
            <button
              onClick={() => scrollToHunk(activeHunk + 1)}
              disabled={activeHunk >= hunks.length - 1}
              className="text-[10px] text-[var(--accent)] hover:underline disabled:text-[var(--muted)]/30 disabled:no-underline px-1"
            >
              Next ▼
            </button>
          </div>
        )}
      </div>
      <div ref={containerRef} className="overflow-auto max-h-64 font-mono text-[11px] leading-relaxed">
        {lines.map((line, i) => (
          <DiffLineRow key={i} line={line} active={activeLines.has(i)} />
        ))}
      </div>
    </div>
  );
}

function DiffLineRow({ line, active }: { line: DiffLine; active: boolean }) {
  let bg = "";
  let prefix = " ";
  let num = "";

  if (line.type === "added") {
    bg = active ? "bg-[var(--success)]/25" : "bg-[var(--success)]/10";
    prefix = "+";
    num = line.newNum ? String(line.newNum) : "";
  } else if (line.type === "removed") {
    bg = active ? "bg-[var(--danger)]/25" : "bg-[var(--danger)]/10";
    prefix = "-";
    num = line.oldNum ? String(line.oldNum) : "";
  } else {
    num = line.oldNum ? String(line.oldNum) : "";
  }

  return (
    <div className={`flex ${bg}`}>
      <span className="w-10 shrink-0 text-right text-[var(--muted)]/50 select-none pr-2">
        {num}
      </span>
      <span
        className={`w-4 shrink-0 text-center select-none ${
          line.type === "added"
            ? "text-[var(--success)]"
            : line.type === "removed"
              ? "text-[var(--danger)]"
              : "text-[var(--muted)]/50"
        }`}
      >
        {prefix}
      </span>
      <span className="whitespace-pre-wrap break-all flex-1 pr-2">
        {line.content || " "}
      </span>
    </div>
  );
}
