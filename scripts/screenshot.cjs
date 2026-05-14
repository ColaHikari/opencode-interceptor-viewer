const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

async function screenshot(name, fn) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await fn(page);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log(`  ✓ ${name}.png`);
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log("Taking screenshots...\n");

  // 1. Homepage with session table visible
  await screenshot("homepage", async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    // Make sure the session table is visible (not loading state)
    await page.waitForSelector("table", { timeout: 10000 });
  });

  // 2. Session detail — Overview tab, call 004 (has response body, tool data)
  await screenshot("session-detail", async (page) => {
    await page.goto(`${BASE}/sessions/ses_1e1f5baa9ffeNIpaBJSkoMbzgq`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    // Click call 004 in the sidebar
    const call004 = page.locator("button").filter({ hasText: "004" }).first();
    await call004.click();
    await page.waitForTimeout(1000);
    // Click Overview tab to ensure we're on it
    const overviewTab = page.locator("button").filter({ hasText: "Overview" }).first();
    await overviewTab.click();
    await page.waitForTimeout(500);
  });

  // 3. Request tab — pick call 006 which has new messages visible
  await screenshot("request-diff", async (page) => {
    await page.goto(`${BASE}/sessions/ses_1e1f5baa9ffeNIpaBJSkoMbzgq`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    // Click call 006 (has accumulated messages)
    const call006 = page.locator("button").filter({ hasText: "006" }).first();
    await call006.click();
    await page.waitForTimeout(500);
    // Click Request tab
    const reqTab = page.locator("button").filter({ hasText: "Request" }).first();
    await reqTab.click();
    await page.waitForTimeout(2000);

    // Click "Expand" buttons on all collapsed messages to show content
    const expandButtons = page.locator("button").filter({ hasText: "Expand" });
    const count = await expandButtons.count();
    for (let i = 0; i < count; i++) {
      await expandButtons.nth(i).click();
      await page.waitForTimeout(200);
    }

    // Also expand folded repeated messages groups
    const foldGroups = page.locator("button").filter({ hasText: "repeated messages" });
    const foldCount = await foldGroups.count();
    for (let i = 0; i < foldCount; i++) {
      await foldGroups.nth(i).click();
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(500);
  });

  // 4. Response tab — call 004 which has the largest response (1832 chars)
  await screenshot("response-md", async (page) => {
    await page.goto(`${BASE}/sessions/ses_1e1f5baa9ffeNIpaBJSkoMbzgq`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    // Click call 004
    const call004 = page.locator("button").filter({ hasText: "004" }).first();
    await call004.click();
    await page.waitForTimeout(500);
    // Click Response tab
    const respTab = page.locator("button").filter({ hasText: "Response" }).first();
    await respTab.click();
    await page.waitForTimeout(2000);

    // Click "Expand all" if the response is collapsed
    const expandAll = page.locator("button").filter({ hasText: "Expand all" });
    if (await expandAll.count() > 0) {
      await expandAll.click();
      await page.waitForTimeout(1000);
    }

    // Click Outline toggle to show the outline panel
    const outlineBtn = page.locator("button[title='Toggle outline']");
    if (await outlineBtn.count() > 0) {
      await outlineBtn.click();
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(500);
  });

  console.log("\nDone!");
})();
