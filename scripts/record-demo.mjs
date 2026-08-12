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
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForFunction(
  () => !document.getElementById("status")?.textContent?.includes("Loading"),
  null,
  { timeout: 30000 },
);
await page.waitForTimeout(1200);
await page.click("#usePin");
await page.waitForTimeout(1800);
const add = page.locator("button[data-lead]").first();
if (await add.count()) await add.click();
await page.waitForTimeout(800);
await page.click("#ask");
await page.waitForTimeout(2000);
const video = page.video();
await context.close();
await browser.close();
if (video) {
  const src = await video.path();
  await rename(src, join(root, "demo/out/crm-demo-transcript.webm"));
}
console.log("wrote demo/out/crm-demo-transcript.webm from", base);
