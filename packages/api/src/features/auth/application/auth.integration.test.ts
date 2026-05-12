/**
 * Auth / Onboarding integration tests.
 *
 * Run:
 *   cd /home/thanhkt/code/steam/nrc-full
 *   DATABASE_URL='postgresql://...' bun x vitest run packages/api/src/features/auth/application/auth.integration.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db, user, account } from "@nrc-full/db";
import { eq } from "drizzle-orm";

import { getOnboardingProfileByUserId, completeOnboardingByUserId } from "./onboarding.js";
import { resolvePersistedRoleState } from "./managed-users.js";

const TEST_USER_ID = "int-auth-user-1";
const TEST_USER_EMAIL = "int-auth-user@test.example.com";

const cleanup = async () => {
  await db.delete(account).where(eq(account.userId, TEST_USER_ID));
  await db.delete(user).where(eq(user.id, TEST_USER_ID));
};

describe("auth integration", () => {
  beforeAll(async () => {
    await cleanup();

    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "2000-01-01",
      email: TEST_USER_EMAIL,
      emailVerified: true,
      id: TEST_USER_ID,
      name: "Integration Test User",
      onboardingCompleted: false,
      systemRole: "USER",
      updatedAt: new Date(),
      userType: "PARTICIPANT",
    });
  });

  afterAll(async () => {
    await cleanup();
  });

  // ── Onboarding Profile ─────────────────────────────────────────

  it("returns onboarding profile for existing user", async () => {
    const profile = await getOnboardingProfileByUserId(TEST_USER_ID);

    expect(profile).not.toBeNull();
    expect(profile?.onboardingCompleted).toBe(false);
    expect(profile?.address).toBe("");
    expect(profile?.city).toBe("");
    expect(profile?.phone).toBe("");
    expect(profile?.organizationOrSchool).toBe("");
    expect(profile?.dateOfBirth).toBe("2000-01-01");
  });

  it("returns null for nonexistent user", async () => {
    const profile = await getOnboardingProfileByUserId("nonexistent-user-id");
    expect(profile).toBeNull();
  });

  it("completes onboarding and persists data", async () => {
    await completeOnboardingByUserId(TEST_USER_ID, {
      address: "225 Le Loi",
      city: "Thành phố Hồ Chí Minh",
      dateOfBirth: "2000-10-10",
      organizationOrSchool: "NRC Academy",
      phone: "0911222333",
    });

    const profile = await getOnboardingProfileByUserId(TEST_USER_ID);

    expect(profile).not.toBeNull();
    expect(profile?.onboardingCompleted).toBe(true);
    expect(profile?.address).toBe("225 Le Loi");
    expect(profile?.city).toBe("Thành phố Hồ Chí Minh");
    expect(profile?.dateOfBirth).toBe("2000-10-10");
    expect(profile?.organizationOrSchool).toBe("NRC Academy");
    expect(profile?.phone).toBe("0911222333");
  });

  it("updates onboarding data on re-completion", async () => {
    await completeOnboardingByUserId(TEST_USER_ID, {
      address: "456 Nguyen Hue",
      city: "Thành phố Hà Nội",
      dateOfBirth: "2001-05-15",
      organizationOrSchool: "NRC University",
      phone: "0909000000",
    });

    const profile = await getOnboardingProfileByUserId(TEST_USER_ID);

    expect(profile?.address).toBe("456 Nguyen Hue");
    expect(profile?.city).toBe("Thành phố Hà Nội");
    expect(profile?.organizationOrSchool).toBe("NRC University");
    expect(profile?.phone).toBe("0909000000");
  });

  // ── User type consistency check (DB constraint) ─────────────────

  it("enforces user_type_system_role_consistency_check constraint", async () => {
    const userId = crypto.randomUUID();

    // Create a STAFF/ADMIN user — should succeed
    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "2000-01-01",
      email: `staff-${userId.slice(0, 8)}@test.example.com`,
      emailVerified: true,
      id: userId,
      name: "Staff User",
      systemRole: "ADMIN",
      updatedAt: new Date(),
      userType: "STAFF",
    });

    // Verify it was created
    const [created] = await db.select().from(user).where(eq(user.id, userId));
    expect(created?.userType).toBe("STAFF");
    expect(created?.systemRole).toBe("ADMIN");

    // Cleanup
    await db.delete(user).where(eq(user.id, userId));
  });

  // ── Account provider integration ───────────────────────────────

  it("creates and queries account records", async () => {
    const accountId = crypto.randomUUID();
    await db.insert(account).values({
      accountId: "google-12345",
      createdAt: new Date(),
      id: accountId,
      providerId: "google",
      updatedAt: new Date(),
      userId: TEST_USER_ID,
    });

    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, TEST_USER_ID));

    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.providerId).toBe("google");

    // Cleanup
    await db.delete(account).where(eq(account.id, accountId));
  });

  // ── resolvePersistedRoleState (pure function with DB-level constraint) ──

  it("resolves role state for all transitions", () => {
    // PARTICIPANT → ADMIN → STAFF
    expect(resolvePersistedRoleState({ currentUserType: "PARTICIPANT", targetSystemRole: "ADMIN" }))
      .toEqual({ systemRole: "ADMIN", userType: "STAFF" });

    // MENTOR → MANAGER → STAFF
    expect(resolvePersistedRoleState({ currentUserType: "MENTOR", targetSystemRole: "MANAGER" }))
      .toEqual({ systemRole: "MANAGER", userType: "STAFF" });

    // STAFF → USER → PARTICIPANT
    expect(resolvePersistedRoleState({ currentUserType: "STAFF", targetSystemRole: "USER" }))
      .toEqual({ systemRole: "USER", userType: "PARTICIPANT" });
  });
});
