import type { APIRequestContext, APIResponse } from "@playwright/test";

import { expect, test } from "@playwright/test";

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3000";
const AUTH_HELPER_BASE_URL = `${API_BASE_URL}/api/test/auth`;
const DATA_HELPER_BASE_URL = `${API_BASE_URL}/api/test/data`;

const createTestEmail = (label: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `pw-registration-${label}-${timestamp}-${randomSuffix}@example.com`;
};

const createSeasonYear = (): string => String(3600 + Math.floor(Math.random() * 300));

const ensureOk = async (response: APIResponse, context: string): Promise<void> => {
  if (response.ok()) {
    return;
  }

  throw new Error(`${context} failed with ${response.status()}: ${await response.text()}`);
};

const seedUser = async (request: APIRequestContext, email: string): Promise<void> => {
  const response = await request.post(`${AUTH_HELPER_BASE_URL}/seed-google-user`, {
    data: {
      email,
      onboardingCompleted: true,
      systemRole: "USER",
    },
  });

  await ensureOk(response, "seed-google-user");
};

const seedTeam = async (
  request: APIRequestContext,
  email: string,
): Promise<{ organizationId: string; teamName: string }> => {
  const response = await request.post(`${DATA_HELPER_BASE_URL}/seed-team`, {
    data: {
      email,
      role: "TEAM_MENTOR",
      teamName: "Playwright Robotics",
      teamNumber: `PW${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    },
  });

  await ensureOk(response, "seed-team");
  return (await response.json()) as { organizationId: string; teamName: string };
};

const createSessionForUser = async (
  request: APIRequestContext,
  email: string,
  activeOrganizationId: string,
): Promise<void> => {
  const response = await request.post(`${AUTH_HELPER_BASE_URL}/create-session`, {
    data: { activeOrganizationId, email },
  });

  await ensureOk(response, "create-session");
};

const seedOpenEvent = async (request: APIRequestContext): Promise<{ eventId: string; year: string }> => {
  const year = createSeasonYear();
  const response = await request.post(`${DATA_HELPER_BASE_URL}/seed-season-page`, {
    data: {
      events: [
        {
          eventCode: "REG",
          eventEndsAt: `${year}-08-12T10:00:00.000Z`,
          eventStartsAt: `${year}-08-10T10:00:00.000Z`,
          location: "Ho Chi Minh City",
          name: "Registration E2E Regional",
          registrationEndsAt: `${year}-07-20T10:00:00.000Z`,
          registrationStartsAt: "2026-01-01T00:00:00.000Z",
          status: "registration_open",
          timezone: "Asia/Ho_Chi_Minh",
          venue: "Test Venue",
        },
      ],
      gameCode: `REG-${year}`,
      isActive: true,
      theme: "Registration Test",
      year,
    },
  });

  await ensureOk(response, "seed-season-page");
  const body = (await response.json()) as { eventIds: { id: string }[] };
  const eventId = body.eventIds[0]?.id;

  if (!eventId) {
    throw new Error("seed-season-page did not return an event id");
  }

  return { eventId, year };
};

const seedPublishedRegistrationForm = async (
  request: APIRequestContext,
  eventId: string,
): Promise<void> => {
  const response = await request.post(`${DATA_HELPER_BASE_URL}/seed-registration-form`, {
    data: {
      definition: {
        fields: [
          {
            label: "Team name",
            name: "team_name",
            placeholder: "Official team name",
            required: true,
            type: "text",
          },
          {
            label: "Motivation",
            name: "motivation",
            type: "textarea",
          },
        ],
      },
      eventId,
    },
  });

  await ensureOk(response, "seed-registration-form");
};

test.describe("event registration", () => {
  test("mentor draft persists locally and clears after registration creation", async ({ page }) => {
    const email = createTestEmail("mentor");
    const { eventId } = await seedOpenEvent(page.request);

    await page.setExtraHTTPHeaders({
      "x-forwarded-for": `10.42.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
    });
    await seedPublishedRegistrationForm(page.request, eventId);
    await seedUser(page.request, email);
    const team = await seedTeam(page.request, email);
    await createSessionForUser(page.request, email, team.organizationId);

    await page.goto(`/register/${eventId}`);
    await expect(page.getByRole("heading", { name: "Event Registration" })).toBeVisible();
    await expect(page.getByText(`Registering as: ${team.teamName}`)).toBeVisible();

    await page.getByLabel("Team name").fill("<b>Playwright Robotics</b>");
    await page.getByLabel("Motivation").fill("Build reliable robots.");
    await page.reload();

    await expect(page.getByLabel("Team name")).toHaveValue("<b>Playwright Robotics</b>");
    await expect(page.getByLabel("Motivation")).toHaveValue("Build reliable robots.");

    await page.getByRole("button", { name: "Create Registration" }).click();
    await expect(page.getByText("Registration draft created.")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/register/${eventId}/[^/]+$`));

    await page.goto(`/register/${eventId}`);
    await expect(page.getByText("You have an existing registration (draft).")).toBeVisible();
    await expect(page.getByLabel("Team name")).toHaveValue("&lt;b&gt;Playwright Robotics&lt;&#x2F;b&gt;");
    await expect(page.getByLabel("Motivation")).toHaveValue("Build reliable robots.");
  });
});
