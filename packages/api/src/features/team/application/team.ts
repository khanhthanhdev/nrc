import { db, member, organization, session, team, teamInvitation, teamMembership, user } from "@nrc-full/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, isNull, lt, or, sql } from "drizzle-orm";

import type {
  CreateTeamInput,
  GetPublicTeamInput,
  InviteTeamMemberInput,
  ListPublicTeamsInput,
  ListTeamInvitationsInput,
  ListTeamMembersInput,
  RemoveTeamMemberInput,
  RevokeTeamInvitationInput,
  UpdateTeamProfileInput,
} from "../schemas/team.js";

const MIN_MENTOR_AGE_YEARS = 18;
const TEAM_NUMBER_SIZE = 8;
const TEAM_NUMBER_MAX_ATTEMPTS = 10;
type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface TeamSummary {
  cityOrProvince: string | null;
  description: string | null;
  id: string;
  membershipRole: string;
  name: string;
  organizationId: string;
  schoolOrOrganization: string | null;
  teamNumber: string;
}

const toSlugPart = (value: string): string =>
  value
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

const getAgeInYears = (dateOfBirth: string, now: Date = new Date()): number => {
  const birthDate = new Date(`${dateOfBirth}T00:00:00.000Z`);

  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasHadBirthdayThisYear =
    now.getUTCMonth() > birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() && now.getUTCDate() >= birthDate.getUTCDate());

  return hasHadBirthdayThisYear ? age : age - 1;
};

const generateTeamNumberCandidate = (): string =>
  `TM${crypto.randomUUID().replaceAll("-", "").slice(0, TEAM_NUMBER_SIZE).toUpperCase()}`;

const generateUniqueTeamNumber = async (tx: DatabaseTransaction): Promise<string> => {
  for (let attempt = 0; attempt < TEAM_NUMBER_MAX_ATTEMPTS; attempt += 1) {
    const teamNumber = generateTeamNumberCandidate();
    const [existingTeam] = await tx
      .select({ id: team.id })
      .from(team)
      .where(and(eq(team.teamNumber, teamNumber), isNull(team.deletedAt)))
      .limit(1);

    if (!existingTeam) {
      return teamNumber;
    }
  }

  throw new ORPCError("INTERNAL_SERVER_ERROR", {
    message: "Unable to allocate a unique team number.",
  });
};

const generateUniqueOrganizationSlug = async (
  tx: DatabaseTransaction,
  teamName: string,
): Promise<string> => {
  const baseSlug = toSlugPart(teamName) || "team";

  for (let sequence = 0; sequence < 200; sequence += 1) {
    const suffix = sequence === 0 ? "" : `-${sequence + 1}`;
    const slug = `${baseSlug}${suffix}`;
    const [existingOrganization] = await tx
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);

    if (!existingOrganization) {
      return slug;
    }
  }

  throw new ORPCError("CONFLICT", {
    message: "Unable to reserve an organization slug for this team.",
  });
};

export const createTeamForUser = async (
  userId: string,
  sessionId: string,
  input: CreateTeamInput,
): Promise<TeamSummary> => {
  const [currentUser] = await db
    .select({
      dateOfBirth: user.dateOfBirth,
      id: user.id,
      onboardingCompleted: user.onboardingCompleted,
      userType: user.userType,
    })
    .from(user)
    .where(and(eq(user.id, userId), isNull(user.deletedAt)))
    .limit(1);

  if (!currentUser) {
    throw new ORPCError("NOT_FOUND", {
      message: "User profile not found.",
    });
  }

  if (!currentUser.onboardingCompleted) {
    throw new ORPCError("FORBIDDEN", {
      message: "Complete onboarding before creating a team.",
    });
  }

  if (getAgeInYears(currentUser.dateOfBirth) < MIN_MENTOR_AGE_YEARS) {
    throw new ORPCError("FORBIDDEN", {
      message: "You must be at least 18 years old to create a team.",
    });
  }

  return db.transaction(async (tx) => {
    const now = new Date();
    const organizationId = crypto.randomUUID();
    const teamId = crypto.randomUUID();
    const teamNumber = await generateUniqueTeamNumber(tx);
    const organizationSlug = await generateUniqueOrganizationSlug(tx, input.name);

    await tx.insert(organization).values({
      createdAt: now,
      id: organizationId,
      name: input.name,
      slug: organizationSlug,
      teamNumber,
      updatedAt: now,
    });

    await tx.insert(member).values({
      createdAt: now,
      id: crypto.randomUUID(),
      organizationId,
      role: "TEAM_MENTOR",
      userId,
    });

    await tx.insert(team).values({
      cityOrProvince: input.cityOrProvince ?? null,
      createdAt: now,
      createdByUserId: userId,
      description: input.description ?? null,
      id: teamId,
      name: input.name,
      organizationId,
      schoolOrOrganization: input.schoolOrOrganization ?? null,
      teamNumber,
      updatedAt: now,
    });

    await tx.insert(teamMembership).values({
      createdAt: now,
      id: crypto.randomUUID(),
      isActive: true,
      role: "TEAM_MENTOR",
      teamId,
      updatedAt: now,
      userId,
    });

    if (currentUser.userType === "PARTICIPANT") {
      await tx
        .update(user)
        .set({
          userType: "MENTOR",
        })
        .where(eq(user.id, userId));
    }

    await tx
      .update(session)
      .set({
        activeOrganizationId: organizationId,
      })
      .where(eq(session.id, sessionId));

    return {
      cityOrProvince: input.cityOrProvince ?? null,
      description: input.description ?? null,
      id: teamId,
      membershipRole: "TEAM_MENTOR",
      name: input.name,
      organizationId,
      schoolOrOrganization: input.schoolOrOrganization ?? null,
      teamNumber,
    };
  });
};

export const getMyTeamByUser = async (
  userId: string,
  activeOrganizationId?: string | null,
): Promise<TeamSummary | null> => {
  const baseSelection = {
    cityOrProvince: team.cityOrProvince,
    description: team.description,
    id: team.id,
    membershipRole: member.role,
    name: team.name,
    organizationId: team.organizationId,
    schoolOrOrganization: team.schoolOrOrganization,
    teamNumber: team.teamNumber,
  };

  if (activeOrganizationId) {
    const [activeTeam] = await db
      .select(baseSelection)
      .from(team)
      .innerJoin(
        member,
        and(eq(member.organizationId, team.organizationId), eq(member.userId, userId)),
      )
      .where(and(eq(team.organizationId, activeOrganizationId), isNull(team.deletedAt)))
      .limit(1);

    if (activeTeam) {
      return activeTeam;
    }
  }

  const [fallbackTeam] = await db
    .select(baseSelection)
    .from(team)
    .innerJoin(
      member,
      and(eq(member.organizationId, team.organizationId), eq(member.userId, userId)),
    )
    .where(isNull(team.deletedAt))
    .orderBy(asc(team.createdAt))
    .limit(1);

  return fallbackTeam ?? null;
};

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface PublicTeamSummary {
  avatarUrl: string | null;
  cityOrProvince: string | null;
  description: string | null;
  id: string;
  name: string;
  schoolOrOrganization: string | null;
  teamNumber: string;
}

export interface PublicTeamMember {
  id: string;
  joinedAt: string;
  name: string;
  role: string;
  userId: string;
}

export interface PublicTeamProfile {
  avatarUrl: string | null;
  cityOrProvince: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  members: PublicTeamMember[];
  name: string;
  schoolOrOrganization: string | null;
  teamNumber: string;
}

export interface TeamInvitationRecord {
  createdAt: string;
  email: string;
  expiresAt: string;
  id: string;
  role: string;
  status: string;
}

export interface TeamMemberRecord {
  id: string;
  isActive: boolean;
  joinedAt: string;
  name: string;
  role: string;
  userId: string;
}

// ---------------------------------------------------------------------------
// Public queries
// ---------------------------------------------------------------------------

export const listPublicTeams = async (
  input: ListPublicTeamsInput,
): Promise<{ teams: PublicTeamSummary[]; total: number }> => {
  const limit = input.limit ?? 20;
  const page = input.page ?? 1;
  const offset = (page - 1) * limit;

  const baseWhere = isNull(team.deletedAt);
  const escapedSearch = input.search?.replace(/[%_\\]/g, "\\$&");
  const searchWhere = escapedSearch
    ? and(
        baseWhere,
        or(
          ilike(team.name, `%${escapedSearch}%`),
          ilike(team.teamNumber, `%${escapedSearch}%`),
          ilike(team.schoolOrOrganization, `%${escapedSearch}%`),
        ),
      )
    : baseWhere;

  const [countResult, teams] = await Promise.all([
    db.select({ value: count() }).from(team).where(searchWhere),
    db
      .select({
        avatarUrl: team.avatarUrl,
        cityOrProvince: team.cityOrProvince,
        description: team.description,
        id: team.id,
        name: team.name,
        schoolOrOrganization: team.schoolOrOrganization,
        teamNumber: team.teamNumber,
      })
      .from(team)
      .where(searchWhere)
      .orderBy(asc(team.name))
      .limit(limit)
      .offset(offset),
  ]);

  return {
    teams,
    total: countResult[0]?.value ?? 0,
  };
};

export const getPublicTeamByTeamNumber = async (
  input: GetPublicTeamInput,
): Promise<PublicTeamProfile> => {
  const [foundTeam] = await db
    .select({
      avatarUrl: team.avatarUrl,
      cityOrProvince: team.cityOrProvince,
      coverImageUrl: team.coverImageUrl,
      createdAt: team.createdAt,
      description: team.description,
      id: team.id,
      name: team.name,
      organizationId: team.organizationId,
      schoolOrOrganization: team.schoolOrOrganization,
      teamNumber: team.teamNumber,
    })
    .from(team)
    .where(and(eq(team.teamNumber, input.teamNumber), isNull(team.deletedAt)))
    .limit(1);

  if (!foundTeam) {
    throw new ORPCError("NOT_FOUND", {
      message: "Team not found.",
    });
  }

  const members = await db
    .select({
      createdAt: teamMembership.createdAt,
      id: teamMembership.id,
      name: user.name,
      role: teamMembership.role,
      userId: teamMembership.userId,
    })
    .from(teamMembership)
    .innerJoin(user, eq(user.id, teamMembership.userId))
    .where(
      and(
        eq(teamMembership.teamId, foundTeam.id),
        eq(teamMembership.isActive, true),
        isNull(teamMembership.deletedAt),
      ),
    )
    .orderBy(asc(teamMembership.createdAt));

  return {
    avatarUrl: foundTeam.avatarUrl,
    cityOrProvince: foundTeam.cityOrProvince,
    coverImageUrl: foundTeam.coverImageUrl,
    createdAt: foundTeam.createdAt.toISOString(),
    description: foundTeam.description,
    id: foundTeam.id,
    members: members.map((m) => ({
      id: m.id,
      joinedAt: m.createdAt.toISOString(),
      name: m.name,
      role: m.role,
      userId: m.userId,
    })),
    name: foundTeam.name,
    schoolOrOrganization: foundTeam.schoolOrOrganization,
    teamNumber: foundTeam.teamNumber,
  };
};

// ---------------------------------------------------------------------------
// Authenticated helpers
// ---------------------------------------------------------------------------

const TEAM_MANAGEMENT_ROLES = ["TEAM_MENTOR", "TEAM_LEADER"];

const requireTeamManagementRole = async (
  userId: string,
  teamId: string,
): Promise<{ membershipRole: string; organizationId: string }> => {
  const [teamRecord] = await db
    .select({ id: team.id, organizationId: team.organizationId })
    .from(team)
    .where(and(eq(team.id, teamId), isNull(team.deletedAt)))
    .limit(1);

  if (!teamRecord) {
    throw new ORPCError("NOT_FOUND", { message: "Team not found." });
  }

  const [membership] = await db
    .select({ role: teamMembership.role })
    .from(teamMembership)
    .where(
      and(
        eq(teamMembership.teamId, teamId),
        eq(teamMembership.userId, userId),
        eq(teamMembership.isActive, true),
        isNull(teamMembership.deletedAt),
      ),
    )
    .limit(1);

  if (!membership || !TEAM_MANAGEMENT_ROLES.includes(membership.role)) {
    throw new ORPCError("FORBIDDEN", {
      message: "You do not have permission to manage this team.",
    });
  }

  return { membershipRole: membership.role, organizationId: teamRecord.organizationId };
};

const requireTeamMembership = async (
  userId: string,
  teamId: string,
): Promise<{ membershipRole: string }> => {
  const [teamRecord] = await db
    .select({ id: team.id })
    .from(team)
    .where(and(eq(team.id, teamId), isNull(team.deletedAt)))
    .limit(1);

  if (!teamRecord) {
    throw new ORPCError("NOT_FOUND", { message: "Team not found." });
  }

  const [membership] = await db
    .select({ role: teamMembership.role })
    .from(teamMembership)
    .where(
      and(
        eq(teamMembership.teamId, teamId),
        eq(teamMembership.userId, userId),
        eq(teamMembership.isActive, true),
        isNull(teamMembership.deletedAt),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new ORPCError("FORBIDDEN", {
      message: "You are not a member of this team.",
    });
  }

  return { membershipRole: membership.role };
};

// ---------------------------------------------------------------------------
// Authenticated mutations
// ---------------------------------------------------------------------------

export const updateTeamProfile = async (
  userId: string,
  input: UpdateTeamProfileInput,
): Promise<TeamSummary> => {
  const { organizationId } = await requireTeamManagementRole(userId, input.teamId);

  return db.transaction(async (tx) => {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.schoolOrOrganization !== undefined) updateData.schoolOrOrganization = input.schoolOrOrganization;
    if (input.cityOrProvince !== undefined) updateData.cityOrProvince = input.cityOrProvince;
    if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
    if (input.coverImageUrl !== undefined) updateData.coverImageUrl = input.coverImageUrl;

    if (Object.keys(updateData).length > 0) {
      await tx.update(team).set(updateData).where(eq(team.id, input.teamId));
    }

    if (input.name !== undefined) {
      await tx.update(organization).set({ name: input.name }).where(eq(organization.id, organizationId));
    }

    const [updatedMembership] = await tx
      .select({ role: member.role })
      .from(member)
      .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
      .limit(1);

    const [updatedTeam] = await tx
      .select({
        cityOrProvince: team.cityOrProvince,
        description: team.description,
        id: team.id,
        name: team.name,
        organizationId: team.organizationId,
        schoolOrOrganization: team.schoolOrOrganization,
        teamNumber: team.teamNumber,
      })
      .from(team)
      .where(eq(team.id, input.teamId))
      .limit(1);

    if (!updatedTeam) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to read updated team." });
    }

    return {
      ...updatedTeam,
      membershipRole: updatedMembership?.role ?? "TEAM_MENTOR",
    };
  });
};

const INVITATION_EXPIRY_DAYS = 7;

export const inviteTeamMember = async (
  userId: string,
  input: InviteTeamMemberInput,
): Promise<TeamInvitationRecord> => {
  await requireTeamManagementRole(userId, input.teamId);

  await db
    .update(teamInvitation)
    .set({ status: "EXPIRED" })
    .where(
      and(
        eq(teamInvitation.teamId, input.teamId),
        eq(teamInvitation.email, input.email),
        eq(teamInvitation.status, "PENDING"),
        lt(teamInvitation.expiresAt, new Date()),
        isNull(teamInvitation.deletedAt),
      ),
    );

  const [existingPendingInvite] = await db
    .select({ id: teamInvitation.id })
    .from(teamInvitation)
    .where(
      and(
        eq(teamInvitation.teamId, input.teamId),
        eq(teamInvitation.email, input.email),
        eq(teamInvitation.status, "PENDING"),
        isNull(teamInvitation.deletedAt),
      ),
    )
    .limit(1);

  if (existingPendingInvite) {
    throw new ORPCError("CONFLICT", {
      message: "A pending invitation already exists for this email.",
    });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const invitationId = crypto.randomUUID();

  await db.insert(teamInvitation).values({
    createdAt: now,
    email: input.email,
    expiresAt,
    id: invitationId,
    invitedByUserId: userId,
    role: input.role,
    status: "PENDING",
    teamId: input.teamId,
    updatedAt: now,
  });

  return {
    createdAt: now.toISOString(),
    email: input.email,
    expiresAt: expiresAt.toISOString(),
    id: invitationId,
    role: input.role,
    status: "PENDING",
  };
};

export const listTeamInvitations = async (
  userId: string,
  input: ListTeamInvitationsInput,
): Promise<TeamInvitationRecord[]> => {
  await requireTeamMembership(userId, input.teamId);

  const invitations = await db
    .select({
      createdAt: teamInvitation.createdAt,
      email: teamInvitation.email,
      expiresAt: teamInvitation.expiresAt,
      id: teamInvitation.id,
      role: teamInvitation.role,
      status: teamInvitation.status,
    })
    .from(teamInvitation)
    .where(
      and(
        eq(teamInvitation.teamId, input.teamId),
        isNull(teamInvitation.deletedAt),
      ),
    )
    .orderBy(desc(teamInvitation.createdAt));

  return invitations.map((inv) => ({
    createdAt: inv.createdAt.toISOString(),
    email: inv.email,
    expiresAt: inv.expiresAt.toISOString(),
    id: inv.id,
    role: inv.role,
    status: inv.status,
  }));
};

export const revokeTeamInvitation = async (
  userId: string,
  input: RevokeTeamInvitationInput,
): Promise<void> => {
  const [inv] = await db
    .select({
      id: teamInvitation.id,
      status: teamInvitation.status,
      teamId: teamInvitation.teamId,
    })
    .from(teamInvitation)
    .where(and(eq(teamInvitation.id, input.invitationId), isNull(teamInvitation.deletedAt)))
    .limit(1);

  if (!inv) {
    throw new ORPCError("NOT_FOUND", { message: "Invitation not found." });
  }

  await requireTeamManagementRole(userId, inv.teamId);

  if (inv.status !== "PENDING") {
    throw new ORPCError("BAD_REQUEST", {
      message: "Only pending invitations can be revoked.",
    });
  }

  await db
    .update(teamInvitation)
    .set({ revokedAt: new Date(), status: "REVOKED" })
    .where(eq(teamInvitation.id, input.invitationId));
};

export const listTeamMembers = async (
  userId: string,
  input: ListTeamMembersInput,
): Promise<TeamMemberRecord[]> => {
  await requireTeamMembership(userId, input.teamId);

  const members = await db
    .select({
      createdAt: teamMembership.createdAt,
      id: teamMembership.id,
      isActive: teamMembership.isActive,
      name: user.name,
      role: teamMembership.role,
      userId: teamMembership.userId,
    })
    .from(teamMembership)
    .innerJoin(user, eq(user.id, teamMembership.userId))
    .where(
      and(
        eq(teamMembership.teamId, input.teamId),
        eq(teamMembership.isActive, true),
        isNull(teamMembership.deletedAt),
      ),
    )
    .orderBy(asc(teamMembership.createdAt));

  return members.map((m) => ({
    id: m.id,
    isActive: m.isActive,
    joinedAt: m.createdAt.toISOString(),
    name: m.name,
    role: m.role,
    userId: m.userId,
  }));
};

export const removeTeamMember = async (
  userId: string,
  input: RemoveTeamMemberInput,
): Promise<void> => {
  const [membership] = await db
    .select({
      id: teamMembership.id,
      role: teamMembership.role,
      teamId: teamMembership.teamId,
      userId: teamMembership.userId,
    })
    .from(teamMembership)
    .where(
      and(
        eq(teamMembership.id, input.membershipId),
        eq(teamMembership.isActive, true),
        isNull(teamMembership.deletedAt),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new ORPCError("NOT_FOUND", { message: "Membership not found." });
  }

  const { membershipRole } = await requireTeamManagementRole(userId, membership.teamId);

  if (membershipRole !== "TEAM_MENTOR") {
    throw new ORPCError("FORBIDDEN", {
      message: "Only team mentors can remove members.",
    });
  }

  if (membership.userId === userId && membership.role === "TEAM_MENTOR") {
    const [otherMentor] = await db
      .select({ id: teamMembership.id })
      .from(teamMembership)
      .where(
        and(
          eq(teamMembership.teamId, membership.teamId),
          eq(teamMembership.role, "TEAM_MENTOR"),
          eq(teamMembership.isActive, true),
          isNull(teamMembership.deletedAt),
          sql`${teamMembership.id} != ${membership.id}`,
        ),
      )
      .limit(1);

    if (!otherMentor) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot remove the last mentor from the team.",
      });
    }
  }

  const [teamRecord] = await db
    .select({ organizationId: team.organizationId })
    .from(team)
    .where(eq(team.id, membership.teamId))
    .limit(1);

  await db.transaction(async (tx) => {
    await tx
      .update(teamMembership)
      .set({
        deletedAt: new Date(),
        deletedByUserId: userId,
        isActive: false,
      })
      .where(eq(teamMembership.id, input.membershipId));

    if (teamRecord) {
      await tx
        .delete(member)
        .where(
          and(
            eq(member.organizationId, teamRecord.organizationId),
            eq(member.userId, membership.userId),
          ),
        );
    }
  });
};
