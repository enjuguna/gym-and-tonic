import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("main product pages have no serious accessibility violations", async ({ page }) => {
  for (const route of ["/today", "/plan", "/progress", "/meals", "/settings", "/workout"]) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} should load successfully`).toBe(200);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((v) => v.impact === "critical" || v.impact === "serious"), `${route} accessibility`).toEqual([]);
  }
});
