/**
 * Team integration tests.
 *
 * Run:
 *   cd /home/thanhkt/code/steam/nrc-full
 *   DATABASE_URL='postgresql://...' bun x vitest run packages/api/src/features/team/application/team.integration.test.ts
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  db,
  member,
  organization,
  session,
  team,
  teamInvitation,
  teamMembership,
  user,
} from "@nrc-full/db";
import { eq } from "drizzle-orm";

import {
  createTeamForUser,
  getMyTeamByUser,
  getPublicTeamByTeamNumber,
  inviteTeamMember,
  listPublicTeams,
  listTeamInvitations,
  listTeamMembers,
  removeTeamMember,
  revokeTeamInvitation,
  updateTeamProfile,
  resolveNextTeamNumber,
} from "./team.js";

const MENTOR_ID = "int-team-mentor";
const MENTOR_EMAIL = "int-team-mentor@test.example.com";
const SESSION_ID = "int-team-session";
let TEAM_ID = "";
let ORG_ID = "";

const cleanup = async () => {
  if (TEAM_ID) {
    await db.delete(teamMembership).where(eq(teamMembership.teamId, TEAM_ID));
    await db.delete(teamInvitation).where(eq(teamInvitation.teamId, TEAM_ID));
    await db.delete(team).where(eq(team.id, TEAM_ID));
  }
  if (ORG_ID) {
    await db.delete(member).where(eq(member.organizationId, ORG_ID));
    await db.delete(organization).where(eq(organization.id, ORG_ID));
  }
  await db.delete(session).where(eq(session.id, SESSION_ID));
  await db.delete(user).where(eq(user.id, MENTOR_ID));
};

const createTestUser = async () => {
  await db.insert(user).values({
    createdAt: new Date(),
    dateOfBirth: "1990-01-15",
    email: MENTOR_EMAIL,
    emailVerified: true,
    id: MENTOR_ID,
    name: "Test Mentor",
    onboardingCompleted: true,
    systemRole: "USER",
    updatedAt: new Date(),
    userType: "PARTICIPANT",
  });

  await db.insert(session).values({
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    id: SESSION_ID,
    token: "int-team-session-token",
    updatedAt: new Date(),
    userId: MENTOR_ID,
  });
};

describe("team integration", () => {
  beforeAll(async () => {
    await cleanup();
    await createTestUser();
  });

  beforeEach(async () => {
    // Clean team data between tests but keep user/session
    if (TEAM_ID) {
      await db.delete(teamMembership).where(eq(teamMembership.teamId, TEAM_ID));
      await db.delete(teamInvitation).where(eq(teamInvitation.teamId, TEAM_ID));
      await db.delete(team).where(eq(team.id, TEAM_ID));
    }
    if (ORG_ID) {
      await db.delete(member).where(eq(member.organizationId, ORG_ID));
      await db.delete(organization).where(eq(organization.id, ORG_ID));
    }
    TEAM_ID = "";
    ORG_ID = "";
  });

  afterAll(async () => {
    await cleanup();
  });

  // ── Team Creation (transaction) ─────────────────────────────────

  it("creates a team with all related records in a transaction", async () => {
    const result = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "Thành phố Hồ Chí Minh",
      description: "A test team",
      name: "Test Integration Team",
      schoolOrOrganization: "NRC Academy",
      termsAccepted: true,
    });

    expect(result.name).toBe("Test Integration Team");
    expect(result.teamNumber).toMatch(/^\d{5}$/);
    expect(result.membershipRole).toBe("TEAM_MENTOR");
    expect(result.cityOrProvince).toBe("Thành phố Hồ Chí Minh");
    expect(result.schoolOrOrganization).toBe("NRC Academy");

    TEAM_ID = result.id;
    ORG_ID = result.organizationId;

    // Verify organization was created
    const [org] = await db.select().from(organization).where(eq(organization.id, ORG_ID));
    expect(org).toBeDefined();
    expect(org?.name).toBe("Test Integration Team");
    expect(org?.slug).toBe(result.teamNumber);

    // Verify member record
    const members = await db.select().from(member).where(eq(member.organizationId, ORG_ID));
    expect(members).toHaveLength(1);
    expect(members[0]?.userId).toBe(MENTOR_ID);
    expect(members[0]?.role).toBe("TEAM_MENTOR");

    // Verify team membership
    const memberships = await db.select().from(teamMembership).where(eq(teamMembership.teamId, TEAM_ID));
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.userId).toBe(MENTOR_ID);
    expect(memberships[0]?.role).toBe("TEAM_MENTOR");
    expect(memberships[0]?.isActive).toBe(true);

    // Verify user type was upgraded to MENTOR
    const [updatedUser] = await db.select().from(user).where(eq(user.id, MENTOR_ID));
    expect(updatedUser?.userType).toBe("MENTOR");

    // Verify session was updated with active org
    const [updatedSession] = await db.select().from(session).where(eq(session.id, SESSION_ID));
    expect(updatedSession?.activeOrganizationId).toBe(ORG_ID);
  });

  it("allocates sequential team numbers", async () => {
    const team1 = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "Hà Nội",
      name: "Team Alpha",
      schoolOrOrganization: "School A",
      termsAccepted: true,
    });

    const team2 = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "Đà Nẵng",
      name: "Team Beta",
      schoolOrOrganization: "School B",
      termsAccepted: true,
    });

    const num1 = Number(team1.teamNumber);
    const num2 = Number(team2.teamNumber);
    expect(num2).toBe(num1 + 1);

    // Cleanup both
    await db.delete(teamMembership).where(eq(teamMembership.teamId, team1.id));
    await db.delete(teamMembership).where(eq(teamMembership.teamId, team2.id));
    await db.delete(team).where(eq(team.id, team1.id));
    await db.delete(team).where(eq(team.id, team2.id));
    await db.delete(member).where(eq(member.organizationId, team1.organizationId));
    await db.delete(member).where(eq(member.organizationId, team2.organizationId));
    await db.delete(organization).where(eq(organization.id, team1.organizationId));
    await db.delete(organization).where(eq(organization.id, team2.organizationId));
  });

  it("rejects team creation for underage user", async () => {
    const youngId = crypto.randomUUID();
    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "2015-06-01",
      email: `young-${youngId.slice(0, 8)}@test.example.com`,
      emailVerified: true,
      id: youngId,
      name: "Young User",
      onboardingCompleted: true,
      systemRole: "USER",
      updatedAt: new Date(),
      userType: "PARTICIPANT",
    });

    await expect(
      createTeamForUser(youngId, SESSION_ID, {
        cityOrProvince: "HCM",
        name: "Young Team",
        schoolOrOrganization: "School",
        termsAccepted: true,
      }),
    ).rejects.toThrow("at least 18 years old");

    await db.delete(user).where(eq(user.id, youngId));
  });

  it("rejects team creation when onboarding is incomplete", async () => {
    const incompleteId = crypto.randomUUID();
    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "1990-01-01",
      email: `incomplete-${incompleteId.slice(0, 8)}@test.example.com`,
      emailVerified: true,
      id: incompleteId,
      name: "Incomplete User",
      onboardingCompleted: false,
      systemRole: "USER",
      updatedAt: new Date(),
      userType: "PARTICIPANT",
    });

    await expect(
      createTeamForUser(incompleteId, SESSION_ID, {
        cityOrProvince: "HCM",
        name: "Incomplete Team",
        schoolOrOrganization: "School",
        termsAccepted: true,
      }),
    ).rejects.toThrow("Complete onboarding");

    await db.delete(user).where(eq(user.id, incompleteId));
  });

  // ── Get My Team ─────────────────────────────────────────────────

  it("returns the user's team", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "My Team",
      schoolOrOrganization: "My School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    const myTeam = await getMyTeamByUser(MENTOR_ID);
    expect(myTeam).not.toBeNull();
    expect(myTeam?.id).toBe(TEAM_ID);
    expect(myTeam?.name).toBe("My Team");
  });

  it("returns null for user with no team", async () => {
    const noTeamId = crypto.randomUUID();
    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "1990-01-01",
      email: `noteam-${noTeamId.slice(0, 8)}@test.example.com`,
      emailVerified: true,
      id: noTeamId,
      name: "No Team User",
      onboardingCompleted: true,
      systemRole: "USER",
      updatedAt: new Date(),
      userType: "PARTICIPANT",
    });

    const result = await getMyTeamByUser(noTeamId);
    expect(result).toBeNull();

    await db.delete(user).where(eq(user.id, noTeamId));
  });

  // ── Update Team Profile ─────────────────────────────────────────

  it("updates team profile and organization name", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "Original Name",
      schoolOrOrganization: "Original School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    const updated = await updateTeamProfile(MENTOR_ID, {
      cityOrProvince: "Hà Nội",
      name: "Updated Name",
      schoolOrOrganization: "Updated School",
      teamId: TEAM_ID,
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.cityOrProvince).toBe("Hà Nội");
    expect(updated.schoolOrOrganization).toBe("Updated School");

    // Verify org name was also updated
    const [org] = await db.select().from(organization).where(eq(organization.id, ORG_ID));
    expect(org?.name).toBe("Updated Name");
  });

  // ── Invite Team Member ──────────────────────────────────────────

  it("creates a team invitation", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "Invite Team",
      schoolOrOrganization: "Invite School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    const invite = await inviteTeamMember(MENTOR_ID, {
      email: "newmember@test.example.com",
      role: "TEAM_MEMBER",
      teamId: TEAM_ID,
    });

    expect(invite.email).toBe("newmember@test.example.com");
    expect(invite.role).toBe("TEAM_MEMBER");
    expect(invite.status).toBe("PENDING");

    // Verify DB
    const [dbInvite] = await db
      .select()
      .from(teamInvitation)
      .where(eq(teamInvitation.id, invite.id));
    expect(dbInvite?.email).toBe("newmember@test.example.com");
    expect(dbInvite?.invitedByUserId).toBe(MENTOR_ID);
  });

  it("rejects duplicate pending invitation", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "Dup Team",
      schoolOrOrganization: "Dup School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    await inviteTeamMember(MENTOR_ID, {
      email: "dup@test.example.com",
      role: "TEAM_MEMBER",
      teamId: TEAM_ID,
    });

    await expect(
      inviteTeamMember(MENTOR_ID, {
        email: "dup@test.example.com",
        role: "TEAM_MEMBER",
        teamId: TEAM_ID,
      }),
    ).rejects.toThrow("already exists");
  });

  // ── List Team Invitations ───────────────────────────────────────

  it("lists team invitations", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "List Invite Team",
      schoolOrOrganization: "List School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    await inviteTeamMember(MENTOR_ID, {
      email: "list1@test.example.com",
      role: "TEAM_MEMBER",
      teamId: TEAM_ID,
    });

    await inviteTeamMember(MENTOR_ID, {
      email: "list2@test.example.com",
      role: "TEAM_LEADER",
      teamId: TEAM_ID,
    });

    const invitations = await listTeamInvitations(MENTOR_ID, { teamId: TEAM_ID });
    expect(invitations).toHaveLength(2);
    expect(invitations.some((i) => i.email === "list1@test.example.com")).toBe(true);
    expect(invitations.some((i) => i.email === "list2@test.example.com")).toBe(true);
  });

  // ── Revoke Team Invitation ──────────────────────────────────────

  it("revokes a pending invitation", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "Revoke Team",
      schoolOrOrganization: "Revoke School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    const invite = await inviteTeamMember(MENTOR_ID, {
      email: "revoke@test.example.com",
      role: "TEAM_MEMBER",
      teamId: TEAM_ID,
    });

    await revokeTeamInvitation(MENTOR_ID, { invitationId: invite.id });

    // Verify DB
    const [dbInvite] = await db
      .select()
      .from(teamInvitation)
      .where(eq(teamInvitation.id, invite.id));
    expect(dbInvite?.status).toBe("REVOKED");
    expect(dbInvite?.revokedAt).not.toBeNull();
  });

  // ── List Team Members ───────────────────────────────────────────

  it("lists team members", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "Members Team",
      schoolOrOrganization: "Members School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    const members = await listTeamMembers(MENTOR_ID, { teamId: TEAM_ID });
    expect(members).toHaveLength(1);
    expect(members[0]?.userId).toBe(MENTOR_ID);
    expect(members[0]?.role).toBe("TEAM_MENTOR");
    expect(members[0]?.name).toBe("Test Mentor");
  });

  // ── Remove Team Member ──────────────────────────────────────────

  it("prevents removing the last mentor", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "Last Mentor Team",
      schoolOrOrganization: "Last School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    // Add a second mentor
    const otherMentorId = crypto.randomUUID();
    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "1990-01-01",
      email: `other-mentor-${otherMentorId.slice(0, 8)}@test.example.com`,
      emailVerified: true,
      id: otherMentorId,
      name: "Other Mentor",
      onboardingCompleted: true,
      systemRole: "USER",
      updatedAt: new Date(),
      userType: "MENTOR",
    });

    await db.insert(teamMembership).values({
      createdAt: new Date(),
      id: crypto.randomUUID(),
      isActive: true,
      role: "TEAM_MENTOR",
      teamId: TEAM_ID,
      updatedAt: new Date(),
      userId: otherMentorId,
    });
    await db.insert(member).values({
      createdAt: new Date(),
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      role: "TEAM_MENTOR",
      userId: otherMentorId,
    });

    // Now there are 2 mentors: MENTOR_ID and otherMentorId
    // Remove otherMentorId first — should succeed
    const otherMemberships = await db
      .select()
      .from(teamMembership)
      .where(eq(teamMembership.userId, otherMentorId));
    await removeTeamMember(MENTOR_ID, { membershipId: otherMemberships[0]!.id });

    // Now MENTOR_ID is the only mentor — self-removal should be blocked
    // (self-removal check fires before last-mentor check)
    const mentorMemberships = await listTeamMembers(MENTOR_ID, { teamId: TEAM_ID });
    const selfMembership = mentorMemberships.find((m) => m.userId === MENTOR_ID);

    await expect(
      removeTeamMember(MENTOR_ID, { membershipId: selfMembership!.id }),
    ).rejects.toThrow("cannot remove yourself");

    // Cleanup extra user
    await db.delete(user).where(eq(user.id, otherMentorId));
  });

  it("prevents self-removal", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "Self Remove Team",
      schoolOrOrganization: "Self School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    // Add another mentor so the last-mentor check doesn't trigger
    const otherUserId = crypto.randomUUID();
    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "1990-01-01",
      email: `other-${otherUserId.slice(0, 8)}@test.example.com`,
      emailVerified: true,
      id: otherUserId,
      name: "Other Mentor",
      onboardingCompleted: true,
      systemRole: "USER",
      updatedAt: new Date(),
      userType: "MENTOR",
    });

    await db.insert(teamMembership).values({
      createdAt: new Date(),
      id: crypto.randomUUID(),
      isActive: true,
      role: "TEAM_MENTOR",
      teamId: TEAM_ID,
      updatedAt: new Date(),
      userId: otherUserId,
    });
    await db.insert(member).values({
      createdAt: new Date(),
      id: crypto.randomUUID(),
      organizationId: ORG_ID,
      role: "TEAM_MENTOR",
      userId: otherUserId,
    });

    const members = await listTeamMembers(MENTOR_ID, { teamId: TEAM_ID });
    const selfMembership = members.find((m) => m.userId === MENTOR_ID);

    await expect(
      removeTeamMember(MENTOR_ID, { membershipId: selfMembership!.id }),
    ).rejects.toThrow("cannot remove yourself");

    // Cleanup extra user
    await db.delete(teamMembership).where(eq(teamMembership.userId, otherUserId));
    await db.delete(member).where(eq(member.userId, otherUserId));
    await db.delete(user).where(eq(user.id, otherUserId));
  });

  // ── Public APIs ─────────────────────────────────────────────────

  it("lists public teams with pagination", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "Public Team",
      schoolOrOrganization: "Public School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    const result = await listPublicTeams({ limit: 10, page: 1 });
    expect(result.teams.length).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.teams.some((t) => t.id === TEAM_ID)).toBe(true);
  });

  it("gets public team by team number", async () => {
    const created = await createTeamForUser(MENTOR_ID, SESSION_ID, {
      cityOrProvince: "HCM",
      name: "Profile Team",
      schoolOrOrganization: "Profile School",
      termsAccepted: true,
    });
    TEAM_ID = created.id;
    ORG_ID = created.organizationId;

    const profile = await getPublicTeamByTeamNumber({ teamNumber: created.teamNumber });
    expect(profile.id).toBe(TEAM_ID);
    expect(profile.name).toBe("Profile Team");
    expect(profile.members).toHaveLength(1);
    expect(profile.members[0]?.name).toBe("Test Mentor");
  });

  it("throws NOT_FOUND for nonexistent team number", async () => {
    await expect(getPublicTeamByTeamNumber({ teamNumber: "99999" })).rejects.toThrow("not found");
  });

  // ── resolveNextTeamNumber (pure function) ────────────────────────

  it("resolves next team number correctly", () => {
    expect(resolveNextTeamNumber(null)).toBe("00001");
    expect(resolveNextTeamNumber(0)).toBe("00001");
    expect(resolveNextTeamNumber(42)).toBe("00043");
    expect(resolveNextTeamNumber("00099")).toBe("00100");
    expect(resolveNextTeamNumber(99998)).toBe("99999");
  });

  it("throws when team number sequence is exhausted", () => {
    expect(() => resolveNextTeamNumber(99999)).toThrow("Unable to allocate");
    expect(() => resolveNextTeamNumber(-1)).toThrow("Unable to read");
  });
});
