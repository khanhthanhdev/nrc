import type { APIRequestContext, APIResponse } from "@playwright/test";

import { expect, test } from "@playwright/test";

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3000";
const AUTH_HELPER_BASE_URL = `${API_BASE_URL}/api/test/auth`;
const DATA_HELPER_BASE_URL = `${API_BASE_URL}/api/test/data`;

const createTestEmail = (label: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `pw-season-${label}-${timestamp}-${randomSuffix}@example.com`;
};

const createSeasonYear = (): string => String(2100 + Math.floor(Math.random() * 700));

const ensureOk = async (response: APIResponse, context: string): Promise<void> => {
  if (response.ok()) {
    return;
  }

  throw new Error(`${context} failed with ${response.status()}: ${await response.text()}`);
};

const seedUser = async (
  request: APIRequestContext,
  input: {
    email: string;
    onboardingCompleted?: boolean;
    systemRole?: "ADMIN" | "MANAGER" | "USER";
  },
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

const createSessionForUser = async (request: APIRequestContext, email: string): Promise<void> => {
  const response = await request.post(`${AUTH_HELPER_BASE_URL}/create-session`, {
    data: { email },
  });

  await ensureOk(response, "create-session");
};

const seedPublicSeasonPage = async (request: APIRequestContext, year: string): Promise<void> => {
  const response = await request.post(`${DATA_HELPER_BASE_URL}/seed-season-page`, {
    data: {
      announcements: [
        {
          body: "Registration is open and team mentors can start preparing paperwork today.",
          isPinned: true,
          publishedAt: "2026-09-01T08:00:00.000Z",
          sortOrder: 0,
          title: "Registration open now",
        },
        {
          body: "Field tolerances and assembly notes were updated for round one.",
          isPinned: false,
          publishedAt: "2026-09-08T08:00:00.000Z",
          sortOrder: 1,
          title: "Field update",
        },
      ],
      description: "Explore the unknown depths and engineer your way to victory.",
      documents: [
        {
          kind: "PDF",
          sortOrder: 0,
          title: "Game Manual",
          url: "https://example.com/game-manual.pdf",
        },
        {
          kind: "LINK",
          sortOrder: 1,
          title: "Season Q&A",
          url: "https://example.com/qa",
        },
      ],
      events: [
        {
          eventCode: "HANOI",
          eventEndsAt: "2026-10-12T10:00:00.000Z",
          eventStartsAt: "2026-10-10T10:00:00.000Z",
          location: "Hanoi",
          name: "Hanoi Regional Hub",
          registrationEndsAt: "2026-09-20T10:00:00.000Z",
          registrationStartsAt: "2026-08-20T10:00:00.000Z",
          status: "registration_open",
          summary: "First qualifier of the season.",
          timezone: "Asia/Ho_Chi_Minh",
          venue: "Hanoi Innovation Hub",
        },
        {
          eventCode: "HCMC",
          eventEndsAt: "2026-11-07T10:00:00.000Z",
          eventStartsAt: "2026-11-05T10:00:00.000Z",
          location: "Ho Chi Minh City",
          name: "HCMC Regional Hub",
          status: "published",
          summary: "Southern regional qualifier.",
          timezone: "Asia/Ho_Chi_Minh",
          venue: "Saigon Tech Park",
        },
      ],
      gameCode: `ITD-${year}`,
      isActive: true,
      theme: "Into the Deep",
      year,
    },
  });

  await ensureOk(response, "seed-season-page");
};

const seedAdminSeasonShell = async (request: APIRequestContext, year: string): Promise<void> => {
  const response = await request.post(`${DATA_HELPER_BASE_URL}/seed-season-page`, {
    data: {
      description: "Explore the unknown depths and engineer your way to victory.",
      gameCode: `ITD-${year}`,
      isActive: true,
      theme: "Into the Deep",
      year,
    },
  });

  await ensureOk(response, "seed-season-page");
};

test.describe("season pages", () => {
  test("admin can create, edit, manage content, and delete a season", async ({ page }) => {
    const email = createTestEmail("admin-season");
    const year = createSeasonYear();

    await seedUser(page.request, { email, onboardingCompleted: true, systemRole: "ADMIN" });
    await createSessionForUser(page.request, email);

    await page.goto("/staff/seasons/new");

    await expect(page.getByRole("heading", { name: "Create a new season" })).toBeVisible();
    await expect(page.getByLabel("Year")).toBeVisible();
    await expect(page.getByLabel("Game code")).toBeVisible();
    await expect(page.getByLabel("Theme")).toBeVisible();

    await seedAdminSeasonShell(page.request, year);

    await page.goto(`/staff/seasons/${year}/edit`);
    await expect(page).toHaveURL(new RegExp(`/staff/seasons/${year}/edit$`));
    await expect(page.getByRole("heading", { name: `${year} · Into the Deep` })).toBeVisible();

    await page.getByLabel("Theme").fill("Into the Deep Reloaded");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Season saved.")).toBeVisible();

    await page.getByRole("tab", { name: "Documents" }).click();
    await page.locator("#season-document-create-title").fill("Game Manual");
    await page.locator("#season-document-create-kind").fill("PDF");
    await page
      .locator("input#season-document-create-upload-url")
      .fill("https://example.com/manual.pdf");
    await page.locator("#season-document-create-sort-order").fill("0");
    await page.getByRole("button", { name: "Add document" }).click();
    await expect(page.getByText("Document created.")).toBeVisible();

    const documentRow = page.getByRole("row", { name: /Game Manual/ });
    await expect(documentRow).toBeVisible();
    await documentRow.locator('input[value="Game Manual"]').fill("Game Manual v2");
    await documentRow.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Document saved.")).toBeVisible();

    await page.getByRole("tab", { name: "Announcements" }).click();
    await page.getByLabel("Title").fill("Registration open");
    await page.getByLabel("Body").fill("Registration is now open for mentors and student teams.");
    await page.getByLabel("Sort order").fill("0");
    await page.getByRole("checkbox", { name: "Pin this announcement" }).click();
    await page.getByRole("button", { name: "Create announcement" }).click();

    const announcementRow = page.getByRole("row", { name: /Registration open/ });
    await expect(announcementRow).toBeVisible();
    await announcementRow.locator('input[value="Registration open"]').fill("Registration now open");
    await page
      .getByRole("row", { name: /Registration now open/ })
      .getByRole("button", { name: "Save changes" })
      .click();
    await expect(page.getByText("Announcement saved.")).toBeVisible();

    await page.getByRole("tab", { name: "Basic info" }).click();
    await page.getByRole("button", { name: "Delete season" }).click();
    await page.getByRole("button", { name: "Delete season" }).last().click();

    await expect(page).toHaveURL(/\/staff\/seasons$/);
    await expect(page.getByRole("row", { name: new RegExp(year) })).toHaveCount(0);
  });

  test("public season page renders seeded content and only open events show register CTA", async ({
    page,
  }) => {
    const year = createSeasonYear();

    await seedPublicSeasonPage(page.request, year);

    await page.goto(`/${year}`);

    await expect(page.getByRole("heading", { exact: true, name: year })).toBeVisible();
    await expect(page.getByText("Into the Deep", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: new RegExp(`${year} · Into the Deep`) }),
    ).toBeVisible();
    await expect(page.getByText("Hanoi Regional Hub")).toBeVisible();
    await expect(
      page.getByRole("tabpanel", { name: "Events" }).getByRole("link", { name: "Register" }),
    ).toHaveCount(1);

    await page.getByRole("tab", { name: "Documents" }).click();
    const documentsPanel = page.getByRole("tabpanel", { name: "Documents" });
    await expect(documentsPanel.getByText("Game Manual", { exact: true })).toBeVisible();
    await expect(documentsPanel.getByText("Season Q&A", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Announcements" }).click();
    const announcementsPanel = page.getByRole("tabpanel", { name: "Announcements" });
    await expect(announcementsPanel.getByText("Registration open now")).toBeVisible();
    await expect(announcementsPanel.getByText("Pinned", { exact: true })).toBeVisible();
  });
});
