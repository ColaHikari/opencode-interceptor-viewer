export function formatDuration(ms: number | undefined | null): string {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

export function formatBytes(bytes: number | undefined | null): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function statusColor(code: number | undefined | null): string {
  if (code == null) return "text-[var(--muted)]";
  if (code >= 200 && code < 300) return "text-[var(--success)]";
  if (code >= 400 && code < 500) return "text-[var(--warning)]";
  if (code >= 500) return "text-[var(--danger)]";
  return "text-[var(--muted)]";
}

export function formatTimestamp(ts: string | undefined): string {
  if (!ts) return "-";
  return ts.slice(0, 19).replace("T", " ");
}

export const MD_PROSE =
  "prose prose-sm max-w-none dark:prose-invert " +
  "prose-headings:font-semibold " +
  "prose-a:text-[var(--accent)] " +
  "prose-pre:border prose-pre:border-[var(--border)] " +
  "prose-code:before:content-none prose-code:after:content-none " +
  "prose-table:text-xs";
