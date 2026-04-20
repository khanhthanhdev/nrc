import type { AuthSession } from "@/utils/auth-client";

export type SystemRole = "USER" | "MANAGER" | "ADMIN";
export type TeamMembershipRole = "TEAM_MENTOR" | "TEAM_LEADER" | "TEAM_MEMBER";

export const SEASON_PATTERN = /^\d{4}$/;
export const EVENT_ID_PATTERN = /^[A-Z0-9_-]{3,20}$/;
export const MATCH_NUMBER_PATTERN = /^[1-9]\d*$/;
export const REGISTRATION_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

type SessionUser = AuthSession["user"] & {
  systemRole?: SystemRole;
};

export const isValidSeason = (season: string) => SEASON_PATTERN.test(season);

export const isValidEventId = (eventId: string) => EVENT_ID_PATTERN.test(eventId);

export const isValidRegistrationId = (registrationId: string) =>
  REGISTRATION_ID_PATTERN.test(registrationId);

export const isValidMatchNumber = (matchNumber: string) => MATCH_NUMBER_PATTERN.test(matchNumber);

export const isStaffSystemRole = (systemRole?: string | null): systemRole is "MANAGER" | "ADMIN" =>
  systemRole === "MANAGER" || systemRole === "ADMIN";

export const getSystemRole = (session: AuthSession | null | undefined): SystemRole | undefined => {
  const user = session?.user as SessionUser | undefined;

  return user?.systemRole;
};

export const canWriteRegistration = ({
  membershipRole,
  systemRole,
}: {
  membershipRole?: string | null;
  systemRole?: string | null;
}) => isStaffSystemRole(systemRole) || membershipRole === "TEAM_MENTOR";

export const canReadRegistration = ({
  membershipRole,
  systemRole,
}: {
  membershipRole?: string | null;
  systemRole?: string | null;
}) => isStaffSystemRole(systemRole) || Boolean(membershipRole);
