import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, type ChildProcess } from "child_process";
import path from "path";

const PORT = 3999;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_FIXTURES = path.join(__dirname, "..", "fixtures");

let server: ChildProcess;

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

beforeAll(async () => {
  server = spawn("npx", ["next", "dev", "--port", String(PORT)], {
    cwd: path.join(__dirname, "..", ".."),
    env: { ...process.env, NODE_ENV: "test" },
    stdio: "pipe",
  });
  await waitForServer(`${BASE_URL}/api/sessions`);
}, 60000);

afterAll(() => {
  if (server) {
    server.kill("SIGTERM");
  }
});

describe("E2E smoke test", () => {
  it("GET /api/sessions returns session list", async () => {
    const res = await fetch(`${BASE_URL}/api/sessions`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessions).toBeDefined();
    expect(Array.isArray(data.sessions)).toBe(true);
    // Should find at least one session from default fixture dir
    expect(data.sessions.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/sessions with custom baseDir", async () => {
    const dir = encodeURIComponent(TEST_FIXTURES);
    const res = await fetch(`${BASE_URL}/api/sessions?baseDir=${dir}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessions.length).toBeGreaterThanOrEqual(1);
    expect(data.sessions.map((s: { id: string }) => s.id)).toContain("ses_test");
  });

  it("GET /api/sessions/[id] returns full session", async () => {
    const dir = encodeURIComponent(TEST_FIXTURES);
    const res = await fetch(`${BASE_URL}/api/sessions/ses_test?baseDir=${dir}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("ses_test");
    expect(data.calls).toBeDefined();
    expect(data.calls.length).toBe(4);
  });

  it("GET /api/sessions/[id] returns 404 for unknown session", async () => {
    const res = await fetch(`${BASE_URL}/api/sessions/nonexistent`);
    expect(res.status).toBe(404);
  });

  it("GET /api/search returns results", async () => {
    const dir = encodeURIComponent(TEST_FIXTURES);
    const res = await fetch(`${BASE_URL}/api/search?q=test-model&baseDir=${dir}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
  });

  it("GET /api/search returns 400 for missing query", async () => {
    const res = await fetch(`${BASE_URL}/api/search`);
    expect(res.status).toBe(400);
  });

  it("frontend page returns HTML", async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Interceptor Viewer");
    expect(html).toContain("<html");
  });

  it("session detail page returns HTML", async () => {
    const res = await fetch(`${BASE_URL}/sessions/ses_test`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<html");
  });
});
