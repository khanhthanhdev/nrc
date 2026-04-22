import type { AuthContextSession } from "@nrc-full/api/shared/context";

import { auth } from "./auth";

const isSystemRole = (value: unknown): value is AuthContextSession["user"]["systemRole"] =>
  value === "ADMIN" || value === "MANAGER" || value === "USER";

const isUserType = (value: unknown): value is AuthContextSession["user"]["userType"] =>
  value === "PARTICIPANT" || value === "MENTOR" || value === "STAFF";

export const getAuthSessionFromHeaders = async (
  headers: Headers,
): Promise<AuthContextSession | null> => {
  const session = (await auth.api.getSession({ headers })) as AuthContextSession | null;

  if (!session?.session || !session.user) {
    return null;
  }

  return {
    session: {
      activeOrganizationId:
        typeof session.session.activeOrganizationId === "string"
          ? session.session.activeOrganizationId
          : null,
      expiresAt: session.session.expiresAt,
      id: session.session.id,
      userId: session.session.userId,
    },
    user: {
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      id: session.user.id,
      name: session.user.name,
      systemRole: isSystemRole((session.user as { systemRole?: unknown }).systemRole)
        ? (session.user as { systemRole: AuthContextSession["user"]["systemRole"] }).systemRole
        : null,
      userType: isUserType((session.user as { userType?: unknown }).userType)
        ? (session.user as { userType: AuthContextSession["user"]["userType"] }).userType
        : null,
    },
  };
};
