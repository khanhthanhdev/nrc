/**
 * Integration test helper.
 *
 * Usage:
 *   DATABASE_URL='<test-database-url>' bun x vitest run path/to/integration.test.ts
 *
 * The DATABASE_URL must be set BEFORE vitest starts so the db singleton
 * in @nrc-full/db picks up the test connection.
 */

import { db, user, organization, member, team, teamMembership, session } from "@nrc-full/db";
import { eq, inArray } from "drizzle-orm";
import { and, isNull } from "drizzle-orm";

// ── Seeded entity tracking for cleanup ───────────────────────────────

const seededUserIds: string[] = [];
const seededOrgIds: string[] = [];
const seededTeamIds: string[] = [];

export const trackUser = (id: string) => { seededUserIds.push(id); };
export const trackOrg = (id: string) => { seededOrgIds.push(id); };
export const trackTeam = (id: string) => { seededTeamIds.push(id); };

// ── Factory helpers ──────────────────────────────────────────────────

export const createTestUser = async (overrides: {
  email?: string;
  id?: string;
  name?: string;
  onboardingCompleted?: boolean;
  systemRole?: "USER" | "MANAGER" | "ADMIN";
  userType?: "PARTICIPANT" | "MENTOR" | "STAFF";
  dateOfBirth?: string;
} = {}) => {
  const id = overrides.id ?? crypto.randomUUID();
  const now = new Date();

  await db.insert(user).values({
    createdAt: now,
    dateOfBirth: overrides.dateOfBirth ?? "2000-01-01",
    email: overrides.email ?? `test-${id.slice(0, 8)}@example.com`,
    emailVerified: true,
    id,
    name: overrides.name ?? "Test User",
    onboardingCompleted: overrides.onboardingCompleted ?? true,
    systemRole: overrides.systemRole ?? "USER",
    updatedAt: now,
    userType: overrides.userType ?? "PARTICIPANT",
  });

  trackUser(id);
  return id;
};

export const createTestSession = async (userId: string) => {
  const sessionId = crypto.randomUUID();
  const now = new Date();

  await db.insert(session).values({
    createdAt: now,
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    id: sessionId,
    token: `test-token-${sessionId}`,
    updatedAt: now,
    userId,
  });

  return sessionId;
};

export const createTestOrganization = async (overrides: {
  id?: string;
  name?: string;
  slug?: string;
  teamNumber?: string;
} = {}) => {
  const id = overrides.id ?? crypto.randomUUID();
  const now = new Date();

  await db.insert(organization).values({
    createdAt: now,
    id,
    name: overrides.name ?? "Test Organization",
    slug: overrides.slug ?? `org-${id.slice(0, 8)}`,
    teamNumber: overrides.teamNumber ?? null,
    updatedAt: now,
  });

  trackOrg(id);
  return id;
};

export const createTestTeam = async (overrides: {
  id?: string;
  name?: string;
  organizationId?: string;
  teamNumber?: string;
  createdByUserId?: string;
} = {}) => {
  const orgId = overrides.organizationId ?? await createTestOrganization();
  const id = overrides.id ?? crypto.randomUUID();
  const now = new Date();

  await db.insert(team).values({
    createdAt: now,
    createdByUserId: overrides.createdByUserId ?? null,
    id,
    name: overrides.name ?? "Test Team",
    organizationId: orgId,
    teamNumber: overrides.teamNumber ?? `TN-${id.slice(0, 8)}`,
    updatedAt: now,
  });

  trackTeam(id);
  return { id, organizationId: orgId };
};

export const createTestMembership = async (
  userId: string,
  teamId: string,
  organizationId: string,
  role: "TEAM_MENTOR" | "TEAM_LEADER" | "TEAM_MEMBER" = "TEAM_MENTOR",
) => {
  const membershipId = crypto.randomUUID();
  const now = new Date();

  await db.insert(member).values({
    createdAt: now,
    id: crypto.randomUUID(),
    organizationId,
    role,
    userId,
  });

  await db.insert(teamMembership).values({
    createdAt: now,
    id: membershipId,
    isActive: true,
    role,
    teamId,
    updatedAt: now,
    userId,
  });

  return membershipId;
};

// ── Cleanup ──────────────────────────────────────────────────────────

export const cleanupTestData = async () => {
  // Clean up in reverse dependency order using soft-delete aware approach
  // Since we can't easily cascade, we'll delete by tracked IDs
  // The test DB should have ON DELETE CASCADE on foreign keys

  if (seededTeamIds.length > 0) {
    await db.delete(team).where(inArray(team.id, seededTeamIds));
  }
  if (seededOrgIds.length > 0) {
    await db.delete(organization).where(inArray(organization.id, seededOrgIds));
  }
  if (seededUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, seededUserIds));
  }

  seededUserIds.length = 0;
  seededOrgIds.length = 0;
  seededTeamIds.length = 0;
};
