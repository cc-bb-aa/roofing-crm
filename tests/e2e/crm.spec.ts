import { test, expect } from "@playwright/test";
test("crm loads chester default", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: /Roofing CRM/ })).toBeVisible();
  await expect(page.locator("#status")).not.toHaveText("Loading Oracle artifacts…", { timeout: 30000 });
});
