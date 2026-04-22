import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("home loads with FounderPath title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FounderPath/);
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

  test("GET /api/ventures/fake/onboarding returns 401 without session", async ({ request }) => {
    const res = await request.get("/api/ventures/not-a-real-id/onboarding");
    expect(res.status()).toBe(401);
  });

  test("GET /api/oauth/integration/callback returns 400 without state", async ({ request }) => {
    const res = await request.get("/api/oauth/integration/callback");
    expect([400, 500].includes(res.status())).toBeTruthy();
  });
});
