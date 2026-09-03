import { test, expect } from "@playwright/test";

const routes = ["/", "/today", "/plan", "/progress", "/meals", "/settings", "/workout", "/tools", "/privacy", "/data", "/safety"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("e2e-seeded")) return;
    const day = (new Date().getDay() + 6) % 7;
    const when = new Date().getHours() < 15 ? "am" : "pm";
    const slot = `${day}-${when}`;
    const session = { id: "e2e-session", title: "E2E starter session", focus: "cardio", intensity: "light", minutes: 12, exercises: ["ex-plank"] };
    localStorage.setItem("gt_plan", JSON.stringify({ version: 4, plan: { [slot]: session }, preferences: { duration: "under30", equipment: "home", intensity: "light" }, hasStarted: true, setupDismissed: true, completions: {}, activeWorkout: null, workoutAlerts: { sound: false, vibration: false } }));
    localStorage.setItem("gt_tracking", JSON.stringify({ version: 1, goal: "general-fitness", weightUnit: "kg", dietaryPreference: "omnivore", weightEntries: {}, weightEnabled: false, walking: {}, selectedHabits: [], habitChecks: {}, mealFavorites: [] }));
    sessionStorage.setItem("e2e-seeded", "true");
  });
});

test("all application routes load with meaningful content", async ({ page }) => {
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} should load successfully`).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("body")).not.toContainText("Application error");
  }
});

test("Today starts and completes a guided workout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/today");
  await page.getByRole("button", { name: /Start workout/ }).click();
  await expect(page).toHaveURL(/\/workout/);
  await expect(page.getByRole("heading", { name: "E2E starter session" })).toBeVisible();
  await page.getByRole("button", { name: "Mark exercise done" }).click();
  await expect(page).toHaveURL(/\/today/);
  await expect(page.getByRole("heading", { name: "How did it feel?" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("navigation exposes the current destination and mobile controls", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.locator('a[aria-current="page"]')).toContainText("Settings");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("link", { name: "Today", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Plan", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Progress", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Meals", exact: true })).toBeVisible();
});

test("settings, meal discovery, and optional progress tracking persist", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Weight loss" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("gt_tracking") ?? "{}").goal)).toBe("weight-loss");

  await page.goto("/meals");
  await page.getByLabel("Search meal ideas").fill("rice");
  await expect(page.locator("article").first()).toBeVisible();
  const favourite = page.locator("article").first().getByRole("button");
  await favourite.click();
  await expect(favourite).toHaveAttribute("aria-pressed", "true");

  await page.goto("/progress");
  await page.getByRole("button", { name: "Show" }).click();
  await page.getByLabel(/Weight in kg/).fill("80");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("80.0 kg")).toBeVisible();
});
