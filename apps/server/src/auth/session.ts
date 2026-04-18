import type { AuthContextSession } from "@nrc-full/api/shared/context";

import { auth } from "./auth";

export const getAuthSessionFromHeaders = async (
  headers: Headers,
): Promise<AuthContextSession | null> => {
  const session = await auth.api.getSession({ headers });

  if (!session?.session || !session.user) {
    return null;
  }

  return {
    session: {
      expiresAt: session.session.expiresAt,
      id: session.session.id,
      userId: session.session.userId,
    },
    user: {
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      id: session.user.id,
      name: session.user.name,
    },
  };
};
