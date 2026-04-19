import { db, member, organization, session, team, user } from "@nrc-full/db";
import { ORPCError } from "@orpc/server";
import { and, asc, eq, isNull } from "drizzle-orm";

import type { CreateTeamInput } from "../schemas/team.js";

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
