import { test, expect } from "@playwright/test";

test.describe("Musemint smoke", () => {
  test("dashboard loads with hero", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toBeVisible();
  });

  test("root redirects to dashboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
  });

  test("inbox renders cards or empty state", async ({ page }) => {
    await page.goto("/inbox");
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toBeVisible();
  });

  test("capture form submits", async ({ page }) => {
    await page.goto("/capture?kind=note");
    await page.getByLabel("Title").fill("Playwright capture");
    await page.locator("textarea").first().fill("Musemint works end-to-end");
    await page.getByRole("button", { name: /Save to Musemint/ }).click();
    await expect(page).toHaveURL(/\/inbox/, { timeout: 15_000 });
  });

  test("ready to build lists projects", async ({ page }) => {
    await page.goto("/ready-to-build");
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toBeVisible();
  });
});
