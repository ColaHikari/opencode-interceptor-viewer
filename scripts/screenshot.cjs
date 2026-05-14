const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

async function screenshot(name, fn) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await fn(page);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log(`  ✓ ${name}.png`);
  } finally {
    await browser.close();
  }
}

async function clickCall(page, num) {
  const allCalls = page.locator("button").filter({ hasText: String(num).padStart(3, "0") });
  const count = await allCalls.count();
  // Pick the sidebar call button (not tabs)
  for (let i = 0; i < count; i++) {
    const text = await allCalls.nth(i).textContent();
    if (text && text.trim().startsWith(String(num).padStart(3, "0"))) {
      await allCalls.nth(i).click();
      await page.waitForTimeout(800);
      return;
    }
  }
}

async function clickTab(page, name) {
  const tab = page.locator("button").filter({ hasText: name }).first();
  await tab.click();
  await page.waitForTimeout(1500);
}

async function expandAll(page) {
  // Click every "Expand" button
  const btns = page.locator("button").filter({ hasText: "Expand" });
  const count = await btns.count();
  for (let i = 0; i < count; i++) {
    try { await btns.nth(i).click(); await page.waitForTimeout(150); } catch {}
  }
  // Also expand folded repeated groups
  const groups = page.locator("button").filter({ hasText: /repeated message/ });
  const gCount = await groups.count();
  for (let i = 0; i < gCount; i++) {
    try { await groups.nth(i).click(); await page.waitForTimeout(150); } catch {}
  }
}

(async () => {
  console.log("Taking screenshots...\n");

  // ── 1. Request Tab — Message Diffing ──
  // Pick call 006: accumulated messages, shows new/modified/repeated groups
  await screenshot("request-diff", async (page) => {
    await page.goto(`${BASE}/sessions/ses_1e1f5baa9ffeNIpaBJSkoMbzgq`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await clickCall(page, 6);
    await clickTab(page, "Request");
    // Expand all collapsed messages and repeated groups
    await expandAll(page);
    await page.waitForTimeout(500);
    // Click "Show diff" on visible modified messages
    const diffBtns = page.locator("button").filter({ hasText: "Show diff" });
    const dCount = await diffBtns.count();
    for (let i = 0; i < dCount && i < 2; i++) {
      try { await diffBtns.nth(i).click(); await page.waitForTimeout(300); } catch {}
    }
    await page.waitForTimeout(800);
  });

  // ── 2. Request Tab — Markdown + Outline ──
  // Pick call 004: has assistant message with rich response content
  await screenshot("request-md", async (page) => {
    await page.goto(`${BASE}/sessions/ses_1e1f5baa9ffeNIpaBJSkoMbzgq`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await clickCall(page, 4);
    await clickTab(page, "Request");
    await expandAll(page);
    // Ensure assistant messages are in MD mode (click Raw→MD if needed)
    const mdBtns = page.locator("button").filter({ hasText: "Raw" });
    const mdCount = await mdBtns.count();
    for (let i = 0; i < mdCount; i++) {
      try { await mdBtns.nth(i).click(); await page.waitForTimeout(100); } catch {}
    }
    await page.waitForTimeout(500);
    // Open outline on the first markdown-rendered message
    const outlineBtn = page.locator("button[title='Toggle outline']");
    if (await outlineBtn.count() > 0) {
      await outlineBtn.first().click();
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(800);
  });

  // ── 3. Response Tab — Markdown + Outline ──
  // Pick call 004: largest response body (1832 chars)
  await screenshot("response-md", async (page) => {
    await page.goto(`${BASE}/sessions/ses_1e1f5baa9ffeNIpaBJSkoMbzgq`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await clickCall(page, 4);
    await clickTab(page, "Response");
    // Expand all if collapsed
    const expandAllBtn = page.locator("button").filter({ hasText: "Expand all" });
    if (await expandAllBtn.count() > 0) {
      await expandAllBtn.click();
      await page.waitForTimeout(800);
    }
    // Ensure we're in MD view
    const rawBtn = page.locator("button").filter({ hasText: "Raw" });
    if (await rawBtn.count() > 0) {
      try { await rawBtn.first().click(); await page.waitForTimeout(200); } catch {}
    }
    await page.waitForTimeout(500);
    // Open outline
    const outlineBtn = page.locator("button[title='Toggle outline']");
    if (await outlineBtn.count() > 0) {
      await outlineBtn.click();
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(800);
  });

  console.log("\nDone!");
})();
