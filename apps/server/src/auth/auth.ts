import { account, db, user } from "@nrc-full/db";
import { env } from "@nrc-full/env/server";
import { and, eq, isNull } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { sendPasswordResetEmailViaSteamify, sendVerificationEmailViaSteamify } from "../adapters/email";
import {
  normalizeEmailForLookup,
  shouldBlockCredentialSignUpForGoogleOnlyAccount,
} from "./duplicate-email-policy";
import { resolveStaffRoleAssignmentForEmail } from "./staff-role-policy";

const authOrigin = new URL(env.BETTER_AUTH_URL).origin;
const staffRoleEmailConfig = {
  adminEmail: env.ADMIN_EMAIL,
  managerEmail: env.MANAGER_EMAIL,
} as const;

const syncStaffRoleAssignmentForSession = async (userId: string): Promise<void> => {
  const [existingUser] = await db
    .select({
      email: user.email,
      id: user.id,
      systemRole: user.systemRole,
      userType: user.userType,
    })
    .from(user)
    .where(and(eq(user.id, userId), isNull(user.deletedAt)))
    .limit(1);

  if (!existingUser) {
    return;
  }

  const staffRoleAssignment = resolveStaffRoleAssignmentForEmail(
    existingUser.email,
    staffRoleEmailConfig,
  );

  if (!staffRoleAssignment) {
    return;
  }

  if (
    existingUser.systemRole === staffRoleAssignment.systemRole &&
    existingUser.userType === staffRoleAssignment.userType
  ) {
    return;
  }

  await db.update(user).set(staffRoleAssignment).where(eq(user.id, existingUser.id));
};

export const auth = betterAuth({
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const staffRoleAssignment = resolveStaffRoleAssignmentForEmail(
            newUser.email,
            staffRoleEmailConfig,
          );

          if (!staffRoleAssignment) {
            return;
          }

          return {
            data: staffRoleAssignment,
          };
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await syncStaffRoleAssignmentForSession(session.userId);
        },
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  basePath: "/api/auth",
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ token, url, user: authUser }) => {
      await sendPasswordResetEmailViaSteamify({
        token,
        url,
        user: {
          email: authUser.email,
          name: authUser.name,
        },
      });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignIn: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ url, user: authUser }) => {
      await sendVerificationEmailViaSteamify({
        url,
        user: {
          email: authUser.email,
          name: authUser.name,
        },
      });
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const email = normalizeEmailForLookup(ctx.body?.email);

      if (!email) {
        return;
      }

      const [existingUser] = await db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.email, email), isNull(user.deletedAt)))
        .limit(1);

      if (!existingUser) {
        return;
      }

      const providers = await db
        .select({ providerId: account.providerId })
        .from(account)
        .where(eq(account.userId, existingUser.id));

      if (shouldBlockCredentialSignUpForGoogleOnlyAccount(providers)) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          code: "GOOGLE_ACCOUNT_EXISTS",
          message: "This email is already registered with Google. Please continue with Google.",
        });
      }
    }),
  },
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  trustedOrigins: [env.CORS_ORIGIN, authOrigin],
});

export type AuthSession = typeof auth.$Infer.Session;
