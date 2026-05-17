/**
 * Registration integration tests.
 *
 * Tests the full registration lifecycle: create → submit → review → approve/deny.
 * Requires: event with registration_open status, published form version, team with membership.
 *
 * Run:
 *   cd /home/thanhkt/code/steam/nrc-full
 *   DATABASE_URL='postgresql://...' bun x vitest run packages/api/src/features/registration/application/registration.integration.test.ts
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  db,
  eventRegistrationFormVersionTable,
  eventTable,
  member,
  organization,
  registrationReviewActionTable,
  registrationRevisionTable,
  registrationTable,
  seasonTable,
  session,
  team,
  teamMembership,
  user,
} from "@nrc-full/db";
import { eq } from "drizzle-orm";

import {
  createRegistration,
  submitRegistration,
  updateRegistrationRevision,
  withdrawRegistration,
  reviewRegistration,
  addRegistrationComment,
  getRegistrationDetail,
  listTeamRegistrations,
  listAdminRegistrationsByEvent,
  getAdminRegistrationDetail,
  getEventRegistrationForm,
} from "./registration.js";

const SEASON = "2096";
const EVENT_ID = "int-reg-event";
const EVENT_KEY = `${SEASON}/INTREG`;
const MENTOR_ID = "int-reg-mentor";
const MENTOR_SESSION = "int-reg-session";
const TEAM_ID = "int-reg-team";
const ORG_ID = "int-reg-org";
const FORM_VERSION_ID = "int-reg-form-ver";

const cleanup = async () => {
  await db.delete(registrationReviewActionTable).where(eq(registrationReviewActionTable.registrationId, "int-reg-1"));
  await db.delete(registrationRevisionTable).where(eq(registrationRevisionTable.registrationId, "int-reg-1"));
  await db.delete(registrationTable).where(eq(registrationTable.eventId, EVENT_ID));
  await db.delete(eventRegistrationFormVersionTable).where(eq(eventRegistrationFormVersionTable.eventId, EVENT_ID));
  await db.delete(eventTable).where(eq(eventTable.id, EVENT_ID));
  await db.delete(seasonTable).where(eq(seasonTable.year, SEASON));
  await db.delete(teamMembership).where(eq(teamMembership.teamId, TEAM_ID));
  await db.delete(member).where(eq(member.organizationId, ORG_ID));
  await db.delete(team).where(eq(team.id, TEAM_ID));
  await db.delete(organization).where(eq(organization.id, ORG_ID));
  await db.delete(session).where(eq(session.id, MENTOR_SESSION));
  await db.delete(user).where(eq(user.id, MENTOR_ID));
};

const setupFixtures = async () => {
  const now = new Date();

  // Season
  await db.insert(seasonTable).values({
    createdAt: now,
    gameCode: `REG-${SEASON}`,
    id: crypto.randomUUID(),
    isActive: true,
    theme: "Registration Test Season",
    updatedAt: now,
    year: SEASON,
  });

  // User (mentor)
  await db.insert(user).values({
    createdAt: now,
    dateOfBirth: "1990-01-15",
    email: `${MENTOR_ID}@test.example.com`,
    emailVerified: true,
    id: MENTOR_ID,
    name: "Registration Test Mentor",
    onboardingCompleted: true,
    systemRole: "USER",
    updatedAt: now,
    userType: "MENTOR",
  });

  await db.insert(session).values({
    createdAt: now,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    id: MENTOR_SESSION,
    token: "int-reg-session-token",
    updatedAt: now,
    userId: MENTOR_ID,
  });

  // Team + org
  await db.insert(organization).values({
    createdAt: now,
    id: ORG_ID,
    name: "Reg Test Org",
    slug: "reg-test-org",
    teamNumber: "99990",
    updatedAt: now,
  });

  await db.insert(member).values({
    createdAt: now,
    id: crypto.randomUUID(),
    organizationId: ORG_ID,
    role: "TEAM_MENTOR",
    userId: MENTOR_ID,
  });

  await db.insert(team).values({
    cityOrProvince: "HCM",
    createdAt: now,
    createdByUserId: MENTOR_ID,
    id: TEAM_ID,
    name: "Registration Test Team",
    organizationId: ORG_ID,
    schoolOrOrganization: "Reg School",
    teamNumber: "99990",
    updatedAt: now,
  });

  await db.insert(teamMembership).values({
    createdAt: now,
    id: crypto.randomUUID(),
    isActive: true,
    role: "TEAM_MENTOR",
    teamId: TEAM_ID,
    updatedAt: now,
    userId: MENTOR_ID,
  });

  // Event
  await db.insert(eventTable).values({
    createdAt: now,
    eventCode: "INTREG",
    eventEndsAt: new Date("2096-07-12"),
    eventKey: EVENT_KEY,
    eventStartsAt: new Date("2096-07-10"),
    id: EVENT_ID,
    name: "Integration Registration Championship",
    season: SEASON,
    status: "registration_open",
    updatedAt: now,
  });

  // Published form version
  await db.insert(eventRegistrationFormVersionTable).values({
    createdAt: now,
    createdByUserId: MENTOR_ID,
    definition: {
      fields: [
        { label: "Team Name", name: "teamName", required: true, type: "text" },
        { label: "Motivation", name: "motivation", required: false, type: "textarea" },
      ],
    },
    eventId: EVENT_ID,
    id: FORM_VERSION_ID,
    isPublished: true,
    publishedAt: now,
    updatedAt: now,
    versionNumber: 1,
  });
};

const cleanRegistrations = async () => {
  await db.delete(registrationReviewActionTable).where(eq(registrationReviewActionTable.registrationId, "int-reg-1"));
  await db.delete(registrationRevisionTable).where(eq(registrationRevisionTable.registrationId, "int-reg-1"));
  await db.delete(registrationTable).where(eq(registrationTable.eventId, EVENT_ID));
};

describe("registration integration", () => {
  beforeAll(async () => {
    await cleanup();
    await setupFixtures();
  });

  beforeEach(async () => {
    await cleanRegistrations();
  });

  afterAll(async () => {
    await cleanup();
  });

  // ── Create Registration ─────────────────────────────────────────

  it("creates a draft registration with initial revision", async () => {
    const result = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { motivation: "We love robotics!", teamName: "Reg Test Team" },
      teamId: TEAM_ID,
    });

    expect(result.status).toBe("draft");
    expect(result.eventId).toBe(EVENT_ID);
    expect(result.teamId).toBe(TEAM_ID);
    expect(result.currentRevisionNumber).toBe(1);
    expect(result.submittedAt).toBeNull();

    // Verify revision was created
    const detail = await getRegistrationDetail(MENTOR_ID, result.id);
    expect(detail.revisions).toHaveLength(1);
    expect(detail.revisions[0]?.revisionNumber).toBe(1);
    expect(detail.revisions[0]?.payload).toEqual({
      motivation: "We love robotics!",
      teamName: "Reg Test Team",
    });
  });

  it("rejects duplicate registration for same team+event", async () => {
    await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "First" },
      teamId: TEAM_ID,
    });

    await expect(
      createRegistration(MENTOR_ID, {
        eventId: EVENT_ID,
        payload: { teamName: "Second" },
        teamId: TEAM_ID,
      }),
    ).rejects.toThrow("already registered");
  });

  it("rejects registration when event is not in registration_open status", async () => {
    // Create a draft event
    const draftEventId = crypto.randomUUID();
    await db.insert(eventTable).values({
      createdAt: new Date(),
      eventCode: "DRAFTEV",
      eventEndsAt: new Date("2096-08-12"),
      eventKey: `${SEASON}/DRAFTEV`,
      eventStartsAt: new Date("2096-08-10"),
      id: draftEventId,
      name: "Draft Event",
      season: SEASON,
      status: "draft",
      updatedAt: new Date(),
    });

    await expect(
      createRegistration(MENTOR_ID, {
        eventId: draftEventId,
        payload: { teamName: "Fail" },
        teamId: TEAM_ID,
      }),
    ).rejects.toThrow("not open");

    await db.delete(eventTable).where(eq(eventTable.id, draftEventId));
  });

  it("rejects registration without published form version", async () => {
    // Create event without form
    const noFormEventId = crypto.randomUUID();
    await db.insert(eventTable).values({
      createdAt: new Date(),
      eventCode: "NOFORM",
      eventEndsAt: new Date("2096-09-12"),
      eventKey: `${SEASON}/NOFORM`,
      eventStartsAt: new Date("2096-09-10"),
      id: noFormEventId,
      name: "No Form Event",
      season: SEASON,
      status: "registration_open",
      updatedAt: new Date(),
    });

    await expect(
      createRegistration(MENTOR_ID, {
        eventId: noFormEventId,
        payload: { teamName: "Fail" },
        teamId: TEAM_ID,
      }),
    ).rejects.toThrow("No published registration form");

    await db.delete(eventTable).where(eq(eventTable.id, noFormEventId));
  });

  it("returns gone when creating registration for a deleted event", async () => {
    const deletedEventId = crypto.randomUUID();

    await db.insert(eventTable).values({
      createdAt: new Date(),
      deletedAt: new Date(),
      eventCode: "DELEDEV",
      eventEndsAt: new Date("2096-10-12"),
      eventKey: `${SEASON}/DELEDEV`,
      eventStartsAt: new Date("2096-10-10"),
      id: deletedEventId,
      name: "Deleted Event",
      season: SEASON,
      status: "registration_open",
      updatedAt: new Date(),
    });

    await expect(
      createRegistration(MENTOR_ID, {
        eventId: deletedEventId,
        payload: { teamName: "Fail" },
        teamId: TEAM_ID,
      }),
    ).rejects.toMatchObject({ code: "GONE" });

    await db.delete(eventTable).where(eq(eventTable.id, deletedEventId));
  });

  // ── Submit Registration ─────────────────────────────────────────

  it("submits a draft registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Submit Test" },
      teamId: TEAM_ID,
    });

    const submitted = await submitRegistration(MENTOR_ID, draft.id);
    expect(submitted.status).toBe("submitted");
    expect(submitted.submittedAt).not.toBeNull();

    // Verify review action was created
    const actions = await db
      .select()
      .from(registrationReviewActionTable)
      .where(eq(registrationReviewActionTable.registrationId, draft.id));
    expect(actions).toHaveLength(1);
    expect(actions[0]?.actionType).toBe("submitted");
    expect(actions[0]?.previousStatus).toBe("draft");
    expect(actions[0]?.nextStatus).toBe("submitted");
  });

  it("rejects submitting a non-draft registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Double Submit" },
      teamId: TEAM_ID,
    });

    await submitRegistration(MENTOR_ID, draft.id);

    await expect(submitRegistration(MENTOR_ID, draft.id)).rejects.toThrow(
      'cannot be submitted from status "submitted"',
    );
  });

  // ── Update Registration Revision ────────────────────────────────

  it("adds a new revision to a draft registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Rev1" },
      teamId: TEAM_ID,
    });

    const updated = await updateRegistrationRevision(MENTOR_ID, {
      expectedRevisionNumber: draft.currentRevisionNumber,
      payload: { motivation: "Updated motivation", teamName: "Rev2" },
      registrationId: draft.id,
    });

    expect(updated.currentRevisionNumber).toBe(2);

    const detail = await getRegistrationDetail(MENTOR_ID, draft.id);
    expect(detail.revisions).toHaveLength(2);
  });

  it("returns gone when updating a registration after event deletion", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Deleted Event Revision" },
      teamId: TEAM_ID,
    });

    await db
      .update(eventTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(eventTable.id, EVENT_ID));

    try {
      await expect(
        updateRegistrationRevision(MENTOR_ID, {
          expectedRevisionNumber: draft.currentRevisionNumber,
          payload: { teamName: "Should Fail" },
          registrationId: draft.id,
        }),
      ).rejects.toMatchObject({ code: "GONE" });
    } finally {
      await db
        .update(eventTable)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(eventTable.id, EVENT_ID));
    }
  });

  it("adds revision after request_changes", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Review Me" },
      teamId: TEAM_ID,
    });

    await submitRegistration(MENTOR_ID, draft.id);

    // Admin requests changes
    await reviewRegistration(MENTOR_ID, {
      action: "request_changes",
      comment: "Please add more detail",
      registrationId: draft.id,
    });

    // Team updates
    const updated = await updateRegistrationRevision(MENTOR_ID, {
      expectedRevisionNumber: draft.currentRevisionNumber,
      payload: { motivation: "Added detail!", teamName: "Review Me Updated" },
      registrationId: draft.id,
    });

    expect(updated.currentRevisionNumber).toBe(2);
  });

  // ── Withdraw Registration ───────────────────────────────────────

  it("withdraws a draft registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Withdraw Test" },
      teamId: TEAM_ID,
    });

    const withdrawn = await withdrawRegistration(MENTOR_ID, {
      registrationId: draft.id,
    });

    expect(withdrawn.status).toBe("withdrawn");
    expect(withdrawn.withdrawnAt).not.toBeNull();
  });

  it("withdraws a submitted registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Withdraw Submitted" },
      teamId: TEAM_ID,
    });

    await submitRegistration(MENTOR_ID, draft.id);

    const withdrawn = await withdrawRegistration(MENTOR_ID, {
      registrationId: draft.id,
    });

    expect(withdrawn.status).toBe("withdrawn");
  });

  it("rejects withdrawing an approved registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Approved Withdraw" },
      teamId: TEAM_ID,
    });

    await submitRegistration(MENTOR_ID, draft.id);

    await reviewRegistration(MENTOR_ID, {
      action: "approve",
      registrationId: draft.id,
    });

    await expect(
      withdrawRegistration(MENTOR_ID, { registrationId: draft.id }),
    ).rejects.toThrow('cannot be withdrawn from status "approved"');
  });

  // ── Review Registration (Admin) ─────────────────────────────────

  it("approves a submitted registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Approve Me" },
      teamId: TEAM_ID,
    });

    await submitRegistration(MENTOR_ID, draft.id);

    const approved = await reviewRegistration(MENTOR_ID, {
      action: "approve",
      comment: "Great team!",
      registrationId: draft.id,
    });

    expect(approved.status).toBe("approved");
    expect(approved.approvedAt).not.toBeNull();
    expect(approved.reviewedAt).not.toBeNull();
  });

  it("denies a submitted registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Deny Me" },
      teamId: TEAM_ID,
    });

    await submitRegistration(MENTOR_ID, draft.id);

    const denied = await reviewRegistration(MENTOR_ID, {
      action: "deny",
      comment: "Missing info",
      registrationId: draft.id,
    });

    expect(denied.status).toBe("denied");
    expect(denied.deniedAt).not.toBeNull();
  });

  it("requests changes on a submitted registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Changes Please" },
      teamId: TEAM_ID,
    });

    await submitRegistration(MENTOR_ID, draft.id);

    const revised = await reviewRegistration(MENTOR_ID, {
      action: "request_changes",
      comment: "Add motivation section",
      registrationId: draft.id,
    });

    expect(revised.status).toBe("needs_revision");
  });

  it("rejects reviewing a draft registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Draft Review" },
      teamId: TEAM_ID,
    });

    await expect(
      reviewRegistration(MENTOR_ID, {
        action: "approve",
        registrationId: draft.id,
      }),
    ).rejects.toThrow('cannot be reviewed from status "draft"');
  });

  it("full lifecycle: create → submit → request_changes → update → submit → approve", async () => {
    // 1. Create draft
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { motivation: "Initial", teamName: "Full Lifecycle" },
      teamId: TEAM_ID,
    });
    expect(draft.status).toBe("draft");
    expect(draft.currentRevisionNumber).toBe(1);

    // 2. Submit
    const submitted = await submitRegistration(MENTOR_ID, draft.id);
    expect(submitted.status).toBe("submitted");

    // 3. Admin requests changes
    const revised = await reviewRegistration(MENTOR_ID, {
      action: "request_changes",
      comment: "Need more detail",
      registrationId: draft.id,
    });
    expect(revised.status).toBe("needs_revision");

    // 4. Team updates revision
    const updated = await updateRegistrationRevision(MENTOR_ID, {
      expectedRevisionNumber: draft.currentRevisionNumber,
      payload: { motivation: "Detailed motivation here!", teamName: "Full Lifecycle V2" },
      registrationId: draft.id,
    });
    expect(updated.currentRevisionNumber).toBe(2);

    // 5. Re-submit
    const resubmitted = await submitRegistration(MENTOR_ID, draft.id);
    expect(resubmitted.status).toBe("submitted");

    // 6. Admin approves
    const approved = await reviewRegistration(MENTOR_ID, {
      action: "approve",
      comment: "Perfect!",
      registrationId: draft.id,
    });
    expect(approved.status).toBe("approved");

    // 7. Verify full history
    const detail = await getRegistrationDetail(MENTOR_ID, draft.id);
    expect(detail.revisions).toHaveLength(2);
  });

  // ── Add Registration Comment ────────────────────────────────────

  it("adds a comment to a registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Comment Test" },
      teamId: TEAM_ID,
    });

    const comment = await addRegistrationComment(MENTOR_ID, {
      comment: "Looking good so far!",
      isVisibleToTeam: true,
      registrationId: draft.id,
    });

    expect(comment.actionType).toBe("commented");
    expect(comment.comment).toBe("Looking good so far!");
    expect(comment.isVisibleToTeam).toBe(true);
  });

  it("adds a hidden comment", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Hidden Comment" },
      teamId: TEAM_ID,
    });

    const comment = await addRegistrationComment(MENTOR_ID, {
      comment: "Internal note",
      isVisibleToTeam: false,
      registrationId: draft.id,
    });

    expect(comment.isVisibleToTeam).toBe(false);
  });

  // ── List Team Registrations ─────────────────────────────────────

  it("lists team registrations", async () => {
    await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "List 1" },
      teamId: TEAM_ID,
    });

    const regs = await listTeamRegistrations(MENTOR_ID, { teamId: TEAM_ID });
    expect(regs).toHaveLength(1);
    expect(regs[0]?.eventId).toBe(EVENT_ID);
  });

  // ── Admin List / Detail ─────────────────────────────────────────

  it("lists admin registrations by event with team info", async () => {
    await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Admin List" },
      teamId: TEAM_ID,
    });

    const regs = await listAdminRegistrationsByEvent({ eventId: EVENT_ID });
    expect(regs).toHaveLength(1);
    expect(regs[0]?.teamName).toBe("Registration Test Team");
    expect(regs[0]?.teamNumber).toBe("99990");
  });

  it("gets admin registration detail with revisions and review actions", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Admin Detail" },
      teamId: TEAM_ID,
    });

    await submitRegistration(MENTOR_ID, draft.id);

    await reviewRegistration(MENTOR_ID, {
      action: "approve",
      comment: "Approved!",
      registrationId: draft.id,
    });

    const detail = await getAdminRegistrationDetail(draft.id);
    expect(detail.registration.status).toBe("approved");
    expect(detail.registration.teamName).toBe("Registration Test Team");
    expect(detail.revisions).toHaveLength(1);
    expect(detail.reviewActions.length).toBeGreaterThanOrEqual(2); // submitted + approved
  });

  // ── Public Form ─────────────────────────────────────────────────

  it("gets published registration form for an event", async () => {
    const form = await getEventRegistrationForm(EVENT_ID);
    expect(form.versionNumber).toBe(1);
    expect(form.formVersionId).toBe(FORM_VERSION_ID);
    expect(form.definition).toHaveProperty("fields");
  });

  // ── Error cases ─────────────────────────────────────────────────

  it("throws NOT_FOUND for nonexistent registration", async () => {
    await expect(
      getRegistrationDetail(MENTOR_ID, "nonexistent"),
    ).rejects.toThrow("not found");
  });

  it("throws NOT_FOUND when submitting nonexistent registration", async () => {
    await expect(
      submitRegistration(MENTOR_ID, "nonexistent"),
    ).rejects.toThrow("not found");
  });

  it("throws FORBIDDEN for non-team-member accessing registration", async () => {
    const draft = await createRegistration(MENTOR_ID, {
      eventId: EVENT_ID,
      payload: { teamName: "Forbidden" },
      teamId: TEAM_ID,
    });

    const outsiderId = crypto.randomUUID();
    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "1990-01-01",
      email: `outsider-${outsiderId.slice(0, 8)}@test.example.com`,
      emailVerified: true,
      id: outsiderId,
      name: "Outsider",
      systemRole: "USER",
      updatedAt: new Date(),
      userType: "MENTOR",
    });

    await expect(
      getRegistrationDetail(outsiderId, draft.id),
    ).rejects.toThrow("mentor or leader");

    await db.delete(user).where(eq(user.id, outsiderId));
  });
});
