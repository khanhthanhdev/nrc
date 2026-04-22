import type { APIRequestContext, APIResponse } from "@playwright/test";

import { expect, test } from "@playwright/test";

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3000";
const AUTH_HELPER_BASE_URL = `${API_BASE_URL}/api/test/auth`;

const createTestEmail = (label: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `pw-nav-${label}-${timestamp}-${randomSuffix}@example.com`;
};

const ensureOk = async (response: APIResponse, context: string): Promise<void> => {
  if (response.ok()) {
    return;
  }

  throw new Error(`${context} failed with ${response.status()}: ${await response.text()}`);
};

const seedUser = async (
  request: APIRequestContext,
  input: { email: string; onboardingCompleted?: boolean; systemRole?: "ADMIN" | "MANAGER" | "USER" },
): Promise<void> => {
  const response = await request.post(`${AUTH_HELPER_BASE_URL}/seed-google-user`, {
    data: {
      email: input.email,
      onboardingCompleted: input.onboardingCompleted ?? true,
      systemRole: input.systemRole ?? "USER",
    },
  });

  await ensureOk(response, "seed-google-user");
};

const createSessionForUser = async (
  request: APIRequestContext,
  email: string,
): Promise<void> => {
  const response = await request.post(`${AUTH_HELPER_BASE_URL}/create-session`, {
    data: { email },
  });

  await ensureOk(response, "create-session");
};

test.describe("website navigation", () => {
  test("desktop header keeps only public links and switches language", async ({ page }) => {
    const email = createTestEmail("public-header");

    await seedUser(page.request, { email, onboardingCompleted: true, systemRole: "USER" });
    await createSessionForUser(page.request, email);

    await page.goto("/");

    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Events" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Teams" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Staff" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);

    await page.getByRole("button", { name: "VI" }).click();

    await expect(page.getByRole("link", { name: "Trang chu" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Su kien" })).toBeVisible();
  });

  test("admin users are redirected into the new /staff/users route and see admin sidebar items", async ({
    page,
  }) => {
    const email = createTestEmail("admin-shell");

    await seedUser(page.request, { email, onboardingCompleted: true, systemRole: "ADMIN" });
    await createSessionForUser(page.request, email);

    await page.goto("/users");

    await expect(page).toHaveURL(/\/staff\/users$/);
    await expect(page.getByRole("heading", { name: /Manage every account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("manager users keep the staff shell without admin-only items and can open the mobile drawer", async ({
    page,
  }) => {
    const email = createTestEmail("manager-shell");

    await seedUser(page.request, { email, onboardingCompleted: true, systemRole: "MANAGER" });
    await createSessionForUser(page.request, email);

    await page.setViewportSize({ height: 900, width: 390 });
    await page.goto("/staff");

    await expect(page.getByRole("heading", { name: /Manage operations without leaving/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);

    await page.getByRole("button", { name: "Open staff sidebar" }).click();

    await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sync logs" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
  });
});
