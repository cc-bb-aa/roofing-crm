import { chromium } from "@playwright/test";
import { mkdir, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.E2E_BASE_URL ?? "https://cc-bb-aa.github.io/roofing-crm/";
await mkdir(join(root, "demo/out"), { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: join(root, "demo/out"), size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

async function say(text, ms = 2800) {
  await page.evaluate((t) => {
    let el = document.getElementById("demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-caption";
      el.style.cssText =
        "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;background:#111814;color:#e8efe9;padding:12px 16px;border-radius:8px;font:15px/1.4 ui-sans-serif,system-ui;box-shadow:0 8px 24px #0008";
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
  await page.waitForTimeout(ms);
}

await page.goto(base, { waitUntil: "load", timeout: 45000 });
await page.waitForFunction(
  () => !document.getElementById("status")?.textContent?.includes("Loading"),
  null,
  { timeout: 30000 },
);

await say("Open the CRM centered on Chester County, PA.");
await say("Drop a pin and set a five-mile search radius.");
await page.locator("#map").click({ position: { x: 420, y: 280 } });
await page.locator("#radius").fill("5");
await page.click("#usePin");
await page.waitForTimeout(1200);
await say("Show roofs older than the 15-year threshold within the radius.");
await page.locator("#age").fill("15");
await page.uncheck("#open").catch(() => {});
await page.click("#usePin");
await page.waitForTimeout(1500);
await say("Highlight properties with open roofing permits, prioritizing long-open permits.");
await page.locator("#age").fill("0");
await page.check("#open");
await page.click("#usePin");
await page.waitForTimeout(1500);
await say("Open a selected property and review contractor details and BBB rating where available.");
const firstHit = page.locator(".hit").first();
await firstHit.click();
await page.waitForTimeout(1500);
await say("Convert one or more matches into CRM lead records.");
const add = page.locator("button[data-lead]").first();
if (await add.count()) await add.click();
const add2 = page.locator("button[data-lead]").nth(1);
if (await add2.count()) await add2.click();
await page.waitForTimeout(1200);
await say("Ask the agent a natural-language query for roofing opportunities in the area.");
await page.locator("#q").fill(
  "show me open roofing permits older than five years within five miles of West Chester",
);
await page.click("#ask");
await page.waitForTimeout(1800);
await say("Demonstrate filtering leads by roof age, permit status, and location radius.");
await page.locator("#leadAge").fill("0");
await page.check("#leadOpen");
await page.click("#filterLeads");
await page.waitForTimeout(1500);
await say("Show disabled sections for future CRM expansions beyond lead identification: pipeline/jobs, campaigns, billing.", 3500);

const video = page.video();
await context.close();
await browser.close();
if (video) {
  const src = await video.path();
  await rename(src, join(root, "demo/out/crm-demo-transcript.webm"));
}
console.log("wrote demo/out/crm-demo-transcript.webm from", base);
