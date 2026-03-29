import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("home loads with BUSOS title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BUSOS/);
    await expect(page.getByRole("heading", { name: /Founder Operating System/i })).toBeVisible();
  });

  test("demo page loads", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: /Try BUSOS in 60 seconds/i })).toBeVisible();
  });
});

test.describe("api", () => {
  test("POST /api/demo returns 400 when fields missing", async ({ request }) => {
    const res = await request.post("/api/demo", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
  });
});
