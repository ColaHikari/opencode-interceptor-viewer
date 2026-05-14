"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { SessionSummary } from "@/lib/types";
import { formatDuration, statusColor, formatTimestamp } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [baseDir, setBaseDir] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  function fetchSessions(dir?: string) {
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const params = new URLSearchParams();
    if (dir) params.set("baseDir", dir);
    fetch(`/api/sessions?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSessions(data.sessions || []);
        }
      })
      .catch((e) => {
        if (e.name === "AbortError") {
          setError("Request timed out. Check that the server is reachable.");
        } else {
          setError(e.message);
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
  }

  function handleBaseDirSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchSessions(baseDir || undefined);
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Interceptor Viewer</h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              LLM request/response inspector
            </p>
          </div>
          <div className="flex items-center gap-3">
            <form onSubmit={handleBaseDirSubmit} className="flex gap-2">
              <input
                type="text"
                value={baseDir}
                onChange={(e) => setBaseDir(e.target.value)}
                placeholder="Custom data directory..."
                className="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-sm w-80 focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90"
              >
                Scan
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        {loading && (
          <div className="text-[var(--muted)] text-sm">Loading sessions...</div>
        )}

        {error && (
          <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded p-3 text-sm text-[var(--danger)] mb-4">
            {error}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-[var(--muted)] text-sm">
            No sessions found. Point to a directory containing ses_* folders.
          </div>
        )}

        {sessions.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface)] text-left text-[var(--muted)]">
                  <th className="py-2.5 px-4 font-medium text-xs">Session</th>
                  <th className="py-2.5 px-4 font-medium text-xs">Calls</th>
                  <th className="py-2.5 px-4 font-medium text-xs">Provider</th>
                  <th className="py-2.5 px-4 font-medium text-xs">Status Codes</th>
                  <th className="py-2.5 px-4 font-medium text-xs">Duration</th>
                  <th className="py-2.5 px-4 font-medium text-xs">Body Format</th>
                  <th className="py-2.5 px-4 font-medium text-xs">Time Range</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`${i % 2 === 0 ? "bg-[var(--surface)]/30" : ""} hover:bg-[var(--accent)]/5 transition-colors`}
                  >
                    <td className="py-2 px-4">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="text-[var(--accent)] hover:underline font-mono text-xs font-medium"
                      >
                        {s.id}
                      </Link>
                    </td>
                    <td className="py-2 px-4 text-xs">{s.callCount}</td>
                    <td className="py-2 px-4 text-[var(--muted)] text-xs">{s.provider}</td>
                    <td className="py-2 px-4">
                      {Object.entries(s.statusCodes).map(([code, count]) => (
                        <span key={code} className={`${statusColor(Number(code))} mr-2 text-xs font-mono`}>
                          {code}: {count}
                        </span>
                      ))}
                    </td>
                    <td className="py-2 px-4 text-[var(--muted)] text-xs font-mono">
                      {formatDuration(s.totalDurationMs)}
                    </td>
                    <td className="py-2 px-4">
                      <span className="text-[10px] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)] font-mono">
                        {s.primaryBodyFormat}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-[var(--muted)] text-[10px] font-mono">
                      {formatTimestamp(s.firstTimestamp)}
                      {s.lastTimestamp && s.lastTimestamp !== s.firstTimestamp
                        ? " → " + formatTimestamp(s.lastTimestamp)
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
