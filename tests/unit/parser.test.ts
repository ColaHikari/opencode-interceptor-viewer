import { describe, it, expect, beforeAll } from "vitest";
import * as path from "path";
import {
  listSessionDirs,
  parseSession,
  getSessionSummary,
  searchSessions,
} from "@/lib/parser";
import type { Session, SessionSummary } from "@/lib/types";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");
const SES_TEST_DIR = path.join(FIXTURES_DIR, "ses_test");

describe("listSessionDirs", () => {
  it("should list session directories", () => {
    const dirs = listSessionDirs(FIXTURES_DIR);
    expect(dirs).toHaveLength(1);
    expect(dirs[0]).toContain("ses_test");
  });

  it("should return empty array for non-existent directory", () => {
    const dirs = listSessionDirs("/nonexistent/path");
    expect(dirs).toEqual([]);
  });

  it("should ignore non-ses_ directories", () => {
    const dirs = listSessionDirs(FIXTURES_DIR);
    const names = dirs.map((d) => path.basename(d));
    for (const name of names) {
      expect(name).toMatch(/^ses_/);
    }
  });
});

describe("parseSession", () => {
  let session: Session | null;

  beforeAll(() => {
    session = parseSession(SES_TEST_DIR);
  });

  it("should parse a session directory", () => {
    expect(session).not.toBeNull();
    expect(session!.id).toBe("ses_test");
  });

  it("should have the correct number of calls", () => {
    expect(session!.calls).toHaveLength(4);
  });

  it("should sort calls by index", () => {
    const indices = session!.calls.map((c) => c.index);
    expect(indices).toEqual([1, 2, 3, 4]);
  });

  it("should parse call 001 metadata correctly", () => {
    const call = session!.calls.find((c) => c.index === 1)!;
    expect(call.provider).toBe("test");
    expect(call.timestamp).toBe("2026-05-12T21-16-40-117Z");

    expect(call.meta).toBeDefined();
    expect(call.meta!.status).toBe(200);
    expect(call.meta!.durationMs).toBe(1561);
    expect(call.meta!.requestBytes).toBe(102800);
    expect(call.meta!.responseBytes).toBe(11222);
    expect(call.meta!.url).toBe("https://example.com/v1/chat/completions");
    expect(call.meta!.contentType).toContain("text/event-stream");
  });

  it("should parse call 001 request correctly", () => {
    const call = session!.calls.find((c) => c.index === 1)!;
    expect(call.request).toBeDefined();
    expect(call.request!.model).toBe("test-model-v1");
    expect(call.request!.maxTokens).toBe(4096);
    expect(call.request!.temperature).toBe(0.7);
  });

  it("should extract messages from request", () => {
    const call = session!.calls.find((c) => c.index === 1)!;
    expect(call.request!.messages).toBeDefined();
    expect(call.request!.messages!).toHaveLength(2);
    expect(call.request!.messages![0].role).toBe("system");
    expect(call.request!.messages![0].content).toBe("You are a test assistant.");
    expect(call.request!.messages![1].role).toBe("user");
    expect(call.request!.messages![1].content).toBe("Hello, what is 2+2?");
  });

  it("should extract tools from request", () => {
    const call = session!.calls.find((c) => c.index === 1)!;
    expect(call.request!.tools).toBeDefined();
    expect(call.request!.tools!).toHaveLength(1);
  });

  it("should parse call 001 response correctly", () => {
    const call = session!.calls.find((c) => c.index === 1)!;
    expect(call.response).toBeDefined();
    expect(call.response!.status).toBe(200);
    expect(call.response!.statusText).toBe("OK");
    expect(call.response!.body).toBe("The answer is **4**.");
    expect(call.response!.bodyFormat).toBe("replay-text");
    expect(call.response!.bodyReadError).toBeNull();
  });

  it("should handle 500 error responses", () => {
    const call = session!.calls.find((c) => c.index === 2)!;
    expect(call.meta!.status).toBe(500);
    expect(call.response!.status).toBe(500);
    expect(call.response!.bodyReadError).toBe("Connection reset");
    expect(call.response!.bodyOmittedReason).toBe("server error");
  });

  it("should handle empty response bodies", () => {
    const call = session!.calls.find((c) => c.index === 3)!;
    expect(call.response!.body).toBe("");
  });

  it("should capture parse errors for malformed JSON", () => {
    const call = session!.calls.find((c) => c.index === 4)!;
    expect(call!.parseErrors.length).toBeGreaterThan(0);
    expect(call!.parseErrors[0].file).toContain("meta.json");
  });

  it("should preserve raw JSON data", () => {
    const call = session!.calls.find((c) => c.index === 1)!;
    expect(call.request!.raw).toBeDefined();
    expect(call.response!.raw).toBeDefined();
  });

  it("should return null for non-existent directory", () => {
    const result = parseSession("/nonexistent/path");
    expect(result).toBeNull();
  });
});

describe("getSessionSummary", () => {
  let summary: SessionSummary | null;

  beforeAll(() => {
    summary = getSessionSummary(SES_TEST_DIR);
  });

  it("should return a summary", () => {
    expect(summary).not.toBeNull();
  });

  it("should have correct call count", () => {
    expect(summary!.callCount).toBe(4);
  });

  it("should track status codes", () => {
    expect(summary!.statusCodes).toEqual({ 200: 2, 500: 1 });
  });

  it("should identify primary body format", () => {
    expect(summary!.primaryBodyFormat).toBe("replay-text");
  });

  it("should have correct timestamps", () => {
    expect(summary!.firstTimestamp).toBe("2026-05-12T21-16-40-117Z");
    expect(summary!.lastTimestamp).toBe("2026-01-01T00-00-00-000Z");
  });
});

describe("searchSessions", () => {
  it("should find calls by model name", () => {
    const results = searchSessions(FIXTURES_DIR, "test-model-v1");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.field === "model")).toBe(true);
  });

  it("should find calls by message content", () => {
    const results = searchSessions(FIXTURES_DIR, "capital of France");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.field.includes("message"))).toBe(true);
  });

  it("should find calls by response body", () => {
    const results = searchSessions(FIXTURES_DIR, "answer is");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.field === "response")).toBe(true);
  });

  it("should find calls by URL", () => {
    const results = searchSessions(FIXTURES_DIR, "example.com");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.field === "url")).toBe(true);
  });

  it("should return empty results for no match", () => {
    const results = searchSessions(FIXTURES_DIR, "zzz_nonexistent_text_zzz");
    expect(results).toEqual([]);
  });

  it("should be case insensitive", () => {
    const results = searchSessions(FIXTURES_DIR, "TEST-MODEL-V1");
    expect(results.length).toBeGreaterThan(0);
  });
});
