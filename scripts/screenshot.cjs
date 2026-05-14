const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

async function shot(name, url, opts = {}) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500); // let JS render
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.fullPage || false });
  await browser.close();
  console.log(`  ✓ ${name}.png`);
}

(async () => {
  console.log("Taking screenshots...\n");

  // 1. Homepage – session list
  await shot("homepage", `${BASE}/`);

  // 2. Session detail – Overview tab (first call)
  await shot("session-detail", `${BASE}/sessions/ses_1e1f5baa9ffeNIpaBJSkoMbzgq`);

  // 3. Request tab – click to show request tab for second call
  // Navigate to session, then find and click the 002 call, then click Request tab
  {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}/sessions/ses_1e1f5baa9ffeNIpaBJSkoMbzgq`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    // Click the second call (index 002) in the sidebar
    const callButtons = page.locator("button").filter({ has: page.locator("text=002") });
    if (await callButtons.count() > 0) {
      await callButtons.first().click();
      await page.waitForTimeout(1000);
      // Click the Request tab
      const reqTab = page.locator("button").filter({ hasText: "Request" });
      if (await reqTab.count() > 0) {
        await reqTab.first().click();
        await page.waitForTimeout(2000); // wait for markdown render
      }
    }
    await page.screenshot({ path: `${OUT}/request-diff.png`, fullPage: true });
    await browser.close();
    console.log("  ✓ request-diff.png");
  }

  // 4. Response tab with outline
  {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}/sessions/ses_1e1f5baa9ffeNIpaBJSkoMbzgq`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    // Click a call that has a response body
    const btn = page.locator("button").filter({ has: page.locator("text=003") });
    if (await btn.count() > 0) {
      await btn.first().click();
      await page.waitForTimeout(500);
    }
    // Click Response tab
    const respTab = page.locator("button").filter({ hasText: "Response" });
    if (await respTab.count() > 0) {
      await respTab.first().click();
      await page.waitForTimeout(2000);
    }
    // Try to click Outline button if exists
    const outlineBtn = page.locator("button[title='Toggle outline']");
    if (await outlineBtn.count() > 0) {
      await outlineBtn.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${OUT}/response-md.png`, fullPage: true });
    await browser.close();
    console.log("  ✓ response-md.png");
  }

  console.log("\nDone!");
})();
