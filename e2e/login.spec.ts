import { expect, test } from "@playwright/test";

test("login page renders as first unauthenticated screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pixel Cat Office" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue with GitHub/i })).toBeVisible();
});
