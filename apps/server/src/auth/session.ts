import type { AuthContextSession } from "@nrc-full/api/shared/context";

const isSystemRole = (value: unknown): value is AuthContextSession["user"]["systemRole"] =>
  value === "ADMIN" || value === "MANAGER" || value === "USER";

const isUserType = (value: unknown): value is AuthContextSession["user"]["userType"] =>
  value === "PARTICIPANT" || value === "MENTOR" || value === "STAFF";

let warnedAboutInvalidExpiresAt = false;

type BetterAuthSessionResponse = {
  session: {
    activeOrganizationId?: unknown;
    expiresAt?: unknown;
    id: string;
    userId: string;
  };
  user: {
    email: string;
    emailVerified: boolean;
    id: string;
    name: string;
    systemRole?: unknown;
    userType?: unknown;
  };
};

const toExpiresAt = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export const normalizeAuthSession = (
  session: BetterAuthSessionResponse | null,
): AuthContextSession | null => {
  if (!session?.session || !session.user) {
    return null;
  }

  const expiresAt = toExpiresAt(session.session.expiresAt);

  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    if (session.session.expiresAt && !expiresAt && !warnedAboutInvalidExpiresAt) {
      warnedAboutInvalidExpiresAt = true;
      console.warn("Better Auth returned a session with an unparsable expiresAt value.");
    }

    return null;
  }

  return {
    session: {
      activeOrganizationId:
        typeof session.session.activeOrganizationId === "string"
          ? session.session.activeOrganizationId
          : null,
      expiresAt,
      id: session.session.id,
      userId: session.session.userId,
    },
    user: {
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      id: session.user.id,
      name: session.user.name,
      systemRole: isSystemRole(session.user.systemRole) ? session.user.systemRole : null,
      userType: isUserType(session.user.userType) ? session.user.userType : null,
    },
  };
};

export const getAuthSessionFromHeaders = async (
  headers: Headers,
): Promise<AuthContextSession | null> => {
  const { auth } = await import("./auth");
  const session = (await auth.api.getSession({ headers })) as BetterAuthSessionResponse | null;
  return normalizeAuthSession(session);
};
