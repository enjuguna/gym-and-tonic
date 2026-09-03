import { test, expect } from "@playwright/test";

test("Firefox route smoke", async ({ page }) => {
  for (const route of ["/", "/today", "/plan", "/progress", "/meals", "/settings", "/workout"]) {
    await page.goto(route);
    await expect(page.locator("main, body").first()).toBeVisible();
    await expect(page).not.toHaveTitle(/Application error/i);
  }
});
