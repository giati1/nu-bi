import { expect, test } from "@playwright/test";

test("AI Tools page smoke flow", async ({ page }) => {
  const stamp = Date.now();
  const email = `aitools-${stamp}@example.com`;
  const username = `aitools${stamp}`.slice(0, 20);
  const password = "TestPass123!";

  await page.goto("/signup");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByRole("textbox", { name: /username/i }).fill(username);
  await page.getByRole("textbox", { name: /display name/i }).fill("AI Tools Test");
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign up|create account/i }).click();

  await page.waitForURL(/\/onboarding\/ai-circle|\/home/);

  await page.goto("/ai-tools");
  await expect(page.getByTestId("text-to-video-prompt")).toBeVisible();
  await expect(page.getByTestId("image-to-video-upload")).toBeAttached();
  await expect(page.getByTestId("persona-chat-input")).toBeVisible();
  await expect(page.getByText("Voice Tools").first()).toBeVisible();

  await page.getByTestId("text-to-video-prompt").fill(
    "Create a luxury launch teaser with slow camera motion and polished red lighting."
  );
  await page.getByTestId("text-to-video-generate").click();
  await expect(page.getByTestId("video-card-loading")).toBeVisible();
  await expect(page.getByText("Generating your video...")).toBeVisible();

  await expect(page.getByTestId("video-card-completed")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Save to Profile" })).toBeVisible();

  await page.getByTestId("persona-chat-input").fill("Give me a clean launch caption for a new AI tool page.");
  await page.getByTestId("persona-chat-send").click();
  await expect(page.getByTestId("persona-chat-reply").last()).toBeVisible({ timeout: 15_000 });
});
