import type { APIRequestContext, APIResponse, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3000";
const AUTH_HELPER_BASE_URL = `${API_BASE_URL}/api/test/auth`;
const DATA_HELPER_BASE_URL = `${API_BASE_URL}/api/test/data`;

const createTestEmail = (label: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `pw-event-${label}-${timestamp}-${randomSuffix}@example.com`;
};

const createSeasonYear = (): string => String(2800 + Math.floor(Math.random() * 700));

const ensureOk = async (response: APIResponse, context: string): Promise<void> => {
  if (response.ok()) {
    return;
  }

  throw new Error(`${context} failed with ${response.status()}: ${await response.text()}`);
};

const waitForVisibleToastsToClear = async (page: Page): Promise<void> => {
  await page.mouse.move(0, 0);
  await expect(page.locator('[data-sonner-toast][data-visible="true"]')).toHaveCount(0, {
    timeout: 10_000,
  });
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

const seedSeason = async (request: APIRequestContext, year: string): Promise<void> => {
  const response = await request.post(`${DATA_HELPER_BASE_URL}/seed-season-page`, {
    data: {
      description: "Season shell for event CRUD.",
      gameCode: `ITD-${year}`,
      isActive: true,
      theme: "Into the Deep",
      year,
    },
  });

  await ensureOk(response, "seed-season-page");
};

test.describe("staff events", () => {
  test("admin can create, edit, set up, publish, and delete an event", async ({ page }) => {
    const email = createTestEmail("admin");
    const year = createSeasonYear();
    const eventCode = `EV${year.slice(-2)}`;

    await seedUser(page.request, { email, onboardingCompleted: true, systemRole: "ADMIN" });
    await createSessionForUser(page.request, email);
    await seedSeason(page.request, year);

    await page.goto("/staff/events/new");
    await expect(page.getByRole("heading", { name: "Create event" })).toBeVisible();

    await expect(page.locator("#event-season")).toHaveValue(new RegExp(year));
    await page.locator("#event-code").fill(eventCode);
    await page.locator("#event-status").selectOption("registration_open");
    await page.locator("#event-name").fill("Event CRUD Championship");
    await page.locator("#event-summary").fill("Public summary from admin event setup.");
    await page.locator("#event-description").fill("Detailed public event description.");
    await page.locator("#registration-starts").fill(`${year}-05-01T09:00`);
    await page.locator("#registration-ends").fill(`${year}-06-01T17:00`);
    await page.locator("#event-starts").fill(`${year}-07-10T09:00`);
    await page.locator("#event-ends").fill(`${year}-07-12T17:00`);
    await page.locator("#event-timezone").fill("Asia/Ho_Chi_Minh");
    await page.locator("#event-max-participants").fill("48");
    await page.locator("#event-location").fill("Ho Chi Minh City");
    await page.locator("#event-venue").fill("SECC");
    await page.getByRole("button", { name: "Create event" }).click();

    await expect(page).toHaveURL(/\/staff\/events\/[^/]+\/edit$/);
    await expect(page.getByRole("heading", { name: "Event CRUD Championship" })).toBeVisible();

    await page.locator("#event-name").fill("Event CRUD Championship Updated");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Event updated.")).toBeVisible();

    await page.getByRole("tab", { name: "Documents" }).click();
    await page.locator("#document-title").fill("Venue Packet");
    await page.locator("#document-kind").fill("PDF");
    await page.locator("#document-url").fill("https://example.com/venue.pdf");
    await page.locator("#document-sort-order").fill("0");
    await waitForVisibleToastsToClear(page);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Document saved.")).toBeVisible();
    await expect(page.getByText("Venue Packet")).toBeVisible();

    await page.getByRole("tab", { name: "Announcements" }).click();
    await page.locator("#announcement-title").fill("Schedule published");
    await page.locator("#announcement-published-at").fill(`${year}-06-15T08:00`);
    await page.locator("#announcement-body").fill("Teams can now review the event schedule.");
    await page.getByText("Pin announcement").click();
    await waitForVisibleToastsToClear(page);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Announcement saved.")).toBeVisible();
    await expect(page.getByText("Schedule published")).toBeVisible();

    await page.getByRole("tab", { name: "Registration form" }).click();
    await page.locator("textarea.font-mono").fill(
      JSON.stringify(
        {
          fields: [{ key: "teamName", label: "Team name", type: "text" }],
        },
        null,
        2,
      ),
    );
    // Wait for sonner toasts so they do not intercept the click below.
    await waitForVisibleToastsToClear(page);
    await page.getByRole("button", { name: "Create and publish" }).click();
    await expect(page.getByText("Registration form version created.")).toBeVisible();
    await expect(page.getByText("Version 1").first()).toBeVisible();
    await expect(page.getByText("Published").first()).toBeVisible();

    await page.goto(`/${year}/${eventCode}`);
    await expect(page.getByRole("heading", { name: "Event CRUD Championship Updated" })).toBeVisible();
    await expect(page.getByText("Detailed public event description.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Venue Packet" })).toBeVisible();

    await page.goto("/staff/events");
    const eventRow = page.getByRole("row", {
      name: new RegExp(`Event CRUD Championship Updated.*${eventCode}`),
    });
    await expect(eventRow).toBeVisible();
    await eventRow.getByRole("link", { name: "Edit" }).click();
    await page.getByRole("button", { name: "Delete event" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/staff\/events$/);
    await expect(
      page.getByRole("row", {
        name: new RegExp(`Event CRUD Championship Updated.*${eventCode}`),
      }),
    ).toHaveCount(0);
  });
});
