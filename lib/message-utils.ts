import type { CallMessage, MessageDiff, ParsedToolCall, ToolCallArg, DiffLine } from "./types";

export function parseToolCalls(raw: unknown): ParsedToolCall[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((tc: Record<string, unknown>) => {
    const func = (tc.function || {}) as Record<string, unknown>;
    let args: ToolCallArg[] = [];
    const rawArgs = typeof func.arguments === "string" ? func.arguments : "";
    try {
      const parsed = JSON.parse(rawArgs);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        args = Object.entries(parsed).map(([k, v]) => ({ name: k, value: v }));
      }
    } catch {
      // keep args empty on parse failure
    }
    return {
      id: typeof tc.id === "string" ? tc.id : "",
      type: typeof tc.type === "string" ? tc.type : "",
      functionName: typeof func.name === "string" ? func.name : "",
      args,
      rawArgs,
    };
  });
}

function messagesEqual(a: CallMessage, b: CallMessage): boolean {
  if (a.role !== b.role) return false;
  if (a.content !== b.content) return false;
  if (a.name !== b.name) return false;
  if (a.tool_call_id !== b.tool_call_id) return false;
  const aHasTC = Array.isArray(a.tool_calls) && a.tool_calls.length > 0;
  const bHasTC = Array.isArray(b.tool_calls) && b.tool_calls.length > 0;
  if (aHasTC !== bHasTC) return false;
  if (aHasTC && bHasTC) {
    const aTC = a.tool_calls as Array<Record<string, unknown>>;
    const bTC = b.tool_calls as Array<Record<string, unknown>>;
    if (aTC.length !== bTC.length) return false;
    for (let i = 0; i < aTC.length; i++) {
      const af = (aTC[i].function || {}) as Record<string, unknown>;
      const bf = (bTC[i].function || {}) as Record<string, unknown>;
      if (af.name !== bf.name) return false;
      if (af.arguments !== bf.arguments) return false;
    }
  }
  return true;
}

export function diffMessages(
  prevMessages: CallMessage[],
  currentMessages: CallMessage[]
): MessageDiff[] {
  if (!prevMessages || prevMessages.length === 0) {
    return currentMessages.map((m) => ({ type: "new" as const, message: m }));
  }

  const results: MessageDiff[] = [];
  const maxLen = Math.max(prevMessages.length, currentMessages.length);

  for (let i = 0; i < maxLen; i++) {
    const curr = currentMessages[i];
    const prev = prevMessages[i];

    if (!curr && !prev) continue;

    if (!curr) {
      continue;
    }

    if (!prev) {
      results.push({ type: "new", message: curr });
      continue;
    }

    if (messagesEqual(curr, prev)) {
      results.push({ type: "repeated", message: curr, prevMessage: prev });
    } else {
      results.push({ type: "modified", message: curr, prevMessage: prev });
    }
  }

  return results;
}

function lcsLines(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const dp = lcsLines(oldLines, newLines);
  const result: DiffLine[] = [];

  function backtrack(i: number, j: number) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      backtrack(i - 1, j - 1);
      result.push({ type: "same", content: oldLines[i - 1], oldNum: i, newNum: j });
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      backtrack(i, j - 1);
      result.push({ type: "added", content: newLines[j - 1], newNum: j });
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      backtrack(i - 1, j);
      result.push({ type: "removed", content: oldLines[i - 1], oldNum: i });
    }
  }

  backtrack(oldLines.length, newLines.length);
  return result;
}
