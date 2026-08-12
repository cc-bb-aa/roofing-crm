import { test, expect } from "@playwright/test";

test("crm loads chester default", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: /Roofing CRM/ })).toBeVisible();
  await expect(page.locator("#status")).not.toHaveText("Loading Oracle artifacts…", { timeout: 30000 });
});

test("pin search lists matches and can add a lead", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#status")).toContainText("matches", { timeout: 30_000 });
  const add = page.locator("button[data-lead]").first();
  await expect(add).toBeVisible();
  await add.click();
  await expect(page.locator("#leads")).toContainText("Remove");
});

test("agent applies open-permit filter from the question", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#status")).toContainText("matches", { timeout: 30_000 });
  await page.locator("#ask").click();
  await expect(page.locator("#agent")).toContainText("Oracle");
  await expect(page.locator("#open")).toBeChecked();
});
