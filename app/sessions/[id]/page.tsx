"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Session, Call } from "@/lib/types";
import { formatDuration, statusColor } from "@/lib/utils";
import CallDetail from "@/components/CallDetail";
import ThemeToggle from "@/components/ThemeToggle";

type FilterState = {
  status: string;
  emptyResponse: string;
  provider: string;
  model: string;
  search: string;
};

const defaultFilters: FilterState = {
  status: "all",
  emptyResponse: "all",
  provider: "all",
  model: "",
  search: "",
};

export default function SessionPage() {
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSession(data);
          if (data.calls?.length > 0) {
            setSelectedCall(data.calls[0]);
          }
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredCalls = useCallback(() => {
    if (!session) return [];
    return session.calls.filter((call) => {
      if (filters.status !== "all") {
        const s = call.meta?.status?.toString();
        if (filters.status === "2xx" && (!s || !s.startsWith("2"))) return false;
        if (filters.status === "4xx" && (!s || !s.startsWith("4"))) return false;
        if (filters.status === "5xx" && (!s || !s.startsWith("5"))) return false;
        if (filters.status === "error" && call.meta?.status) return false;
      }

      if (filters.emptyResponse === "empty" && call.response?.body) return false;
      if (filters.emptyResponse === "hasResponse" && !call.response?.body) return false;

      if (filters.provider !== "all" && call.provider !== filters.provider) return false;

      if (filters.model && call.request?.model && !call.request.model.toLowerCase().includes(filters.model.toLowerCase())) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inUrl = call.meta?.url?.toLowerCase().includes(q);
        const inModel = call.request?.model?.toLowerCase().includes(q);
        const inResponse = call.response?.body?.toLowerCase().includes(q);
        const inMessages = call.request?.messages?.some(
          (m) => m.content?.toLowerCase().includes(q)
        );
        if (!inUrl && !inModel && !inResponse && !inMessages) return false;
      }

      return true;
    });
  }, [session, filters]);

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="text-[var(--muted)] text-sm">Loading session...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded p-3 text-sm text-[var(--danger)]">
          {error || "Session not found"}
        </div>
        <Link href="/" className="text-[var(--accent)] text-sm mt-4 inline-block hover:underline">
          ← Back to sessions
        </Link>
      </div>
    );
  }

  const calls = filteredCalls();
  const providers = [...new Set(session.calls.map((c) => c.provider))];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="border-b border-[var(--border)] px-4 py-2.5 flex items-center gap-4 shrink-0 bg-[var(--surface)]/50">
        <Link href="/" className="text-[var(--accent)] hover:underline text-sm font-medium">
          ← Sessions
        </Link>
        <h1 className="text-sm font-semibold font-mono tracking-tight">{session.id}</h1>
        <span className="text-xs text-[var(--muted)]">
          {session.calls.length} calls
        </span>
        <div className="flex-1" />
        <ThemeToggle />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-[var(--border)] flex flex-col shrink-0">
          <div className="p-2.5 border-b border-[var(--border)] space-y-2 bg-[var(--surface)]/30">
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="Search messages, model, URL..."
              className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded text-xs focus:border-[var(--accent)]"
            />

            <div className="flex gap-1 flex-wrap">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
                className="px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-xs hover:bg-[var(--border)]/20"
              >
                <option value="all">All status</option>
                <option value="2xx">2xx</option>
                <option value="4xx">4xx</option>
                <option value="5xx">5xx</option>
                <option value="error">Error</option>
              </select>

              <select
                value={filters.emptyResponse}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, emptyResponse: e.target.value }))
                }
                className="px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-xs hover:bg-[var(--border)]/20"
              >
                <option value="all">All responses</option>
                <option value="hasResponse">Has body</option>
                <option value="empty">Empty</option>
              </select>

              <select
                value={filters.provider}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, provider: e.target.value }))
                }
                className="px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-xs hover:bg-[var(--border)]/20"
              >
                <option value="all">All providers</option>
                {providers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={filters.model}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, model: e.target.value }))
                }
                placeholder="Model..."
                className="px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-xs w-20 focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {calls.map((call) => {
              const isSelected = selectedCall?.prefix === call.prefix;
              const hasErrors = call.parseErrors.length > 0;
              const isEmpty = !call.response?.body;
              const isFailed = call.meta?.status && call.meta.status >= 400;

              return (
                <button
                  key={call.prefix}
                  onClick={() => setSelectedCall(call)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[var(--border)]/50 transition-all ${
                    isSelected
                      ? "bg-[var(--accent)]/10 border-l-[3px] border-l-[var(--accent)]"
                      : "hover:bg-[var(--surface)]/50 border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium">
                      {String(call.index).padStart(3, "0")}
                    </span>
                    <span className={`text-xs font-mono ${statusColor(call.meta?.status)}`}>
                      {call.meta?.status || "ERR"}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {call.meta?.durationMs != null
                        ? formatDuration(call.meta.durationMs)
                        : "-"}
                    </span>
                    {isEmpty && (
                      <span className="text-[10px] bg-[var(--warning)]/20 text-[var(--warning)] px-1 rounded">
                        Empty
                      </span>
                    )}
                    {isFailed && (
                      <span className="text-[10px] bg-[var(--danger)]/20 text-[var(--danger)] px-1 rounded">
                        Failed
                      </span>
                    )}
                    {hasErrors && (
                      <span className="text-[10px] bg-[var(--danger)]/20 text-[var(--danger)] px-1 rounded">
                        Parse err
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5 truncate">
                    {call.request?.model || call.provider}
                    {call.request?.model ? ` · ${call.provider}` : ""}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2.5 border-t border-[var(--border)] text-[10px] text-[var(--muted)] bg-[var(--surface)]/30">
            {calls.length} / {session.calls.length} calls
            {filters.search && ` · "${filters.search}"`}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {selectedCall ? (
            <CallDetail
              call={selectedCall}
              prevCall={session.calls.find((c) => c.index === selectedCall.index - 1) || null}
            />
          ) : (
            <div className="p-6 text-[var(--muted)] text-sm">
              Select a call from the timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
