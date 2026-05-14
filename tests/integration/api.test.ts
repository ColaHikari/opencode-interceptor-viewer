import { describe, it, expect } from "vitest";
import { GET as listSessions } from "@/app/api/sessions/route";
import { GET as getSession } from "@/app/api/sessions/[id]/route";
import { GET as searchApi } from "@/app/api/search/route";
import path from "path";

const TEST_FIXTURES = path.join(__dirname, "..", "fixtures");

function createRequest(url: string): Request {
  return new Request(`http://localhost${url}`);
}

describe("API /api/sessions", () => {
  it("should return session list from default fixtures", async () => {
    const req = createRequest("/api/sessions");
    const res = await listSessions(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sessions).toBeDefined();
    expect(Array.isArray(data.sessions)).toBe(true);
    expect(data.sessions.length).toBeGreaterThanOrEqual(1);
  });

  it("should include session fields", async () => {
    const req = createRequest("/api/sessions");
    const res = await listSessions(req);
    const data = await res.json();

    const session = data.sessions[0];
    expect(session.id).toBeDefined();
    expect(session.path).toBeDefined();
    expect(session.callCount).toBeGreaterThan(0);
    expect(session.statusCodes).toBeDefined();
    expect(session.primaryBodyFormat).toBeDefined();
  });

  it("should support baseDir query parameter", async () => {
    const req = createRequest(`/api/sessions?baseDir=${encodeURIComponent(TEST_FIXTURES)}`);
    const res = await listSessions(req);
    const data = await res.json();

    expect(data.sessions.length).toBeGreaterThanOrEqual(1);
    const ids = data.sessions.map((s: { id: string }) => s.id);
    expect(ids).toContain("ses_test");
  });

  it("should return empty list for invalid baseDir", async () => {
    const req = createRequest("/api/sessions?baseDir=/nonexistent");
    const res = await listSessions(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sessions).toEqual([]);
  });
});

describe("API /api/sessions/[id]", () => {
  it("should return a full session", async () => {
    const req = createRequest(`/api/sessions/ses_test?baseDir=${encodeURIComponent(TEST_FIXTURES)}`);
    const res = await getSession(req, { params: Promise.resolve({ id: "ses_test" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe("ses_test");
    expect(data.calls).toBeDefined();
    expect(data.calls.length).toBeGreaterThanOrEqual(4);
  });

  it("should return calls sorted by index", async () => {
    const req = createRequest(`/api/sessions/ses_test?baseDir=${encodeURIComponent(TEST_FIXTURES)}`);
    const res = await getSession(req, { params: Promise.resolve({ id: "ses_test" }) });
    const data = await res.json();

    const indices = data.calls.map((c: { index: number }) => c.index);
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  it("should return 404 for non-existent session", async () => {
    const req = createRequest("/api/sessions/nonexistent");
    const res = await getSession(req, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBeDefined();
  });

  it("should include parse errors in calls", async () => {
    const req = createRequest(`/api/sessions/ses_test?baseDir=${encodeURIComponent(TEST_FIXTURES)}`);
    const res = await getSession(req, { params: Promise.resolve({ id: "ses_test" }) });
    const data = await res.json();

    const badCall = data.calls.find((c: { index: number }) => c.index === 4);
    expect(badCall).toBeDefined();
    expect(badCall.parseErrors.length).toBeGreaterThan(0);
  });
});

describe("API /api/search", () => {
  it("should return search results", async () => {
    const req = createRequest(`/api/search?q=test-model&baseDir=${encodeURIComponent(TEST_FIXTURES)}`);
    const res = await searchApi(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
  });

  it("should search across message content", async () => {
    const req = createRequest(`/api/search?q=capital+of+France&baseDir=${encodeURIComponent(TEST_FIXTURES)}`);
    const res = await searchApi(req);
    const data = await res.json();

    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results.some((r: { field: string }) => r.field.includes("message"))).toBe(true);
  });

  it("should search across response bodies", async () => {
    const req = createRequest(`/api/search?q=answer+is&baseDir=${encodeURIComponent(TEST_FIXTURES)}`);
    const res = await searchApi(req);
    const data = await res.json();

    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results.some((r: { field: string }) => r.field === "response")).toBe(true);
  });

  it("should return 400 for missing query", async () => {
    const req = createRequest("/api/search");
    const res = await searchApi(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should return empty for no matches", async () => {
    const req = createRequest(`/api/search?q=zzz_nonexistent_zzz&baseDir=${encodeURIComponent(TEST_FIXTURES)}`);
    const res = await searchApi(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.results).toEqual([]);
  });
});
