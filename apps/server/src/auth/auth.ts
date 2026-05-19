import { account, db, user } from "@nrc-full/db";
import { env } from "@nrc-full/env/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin, organization } from "better-auth/plugins";
import { defaultStatements } from "better-auth/plugins/organization/access";
import { createAccessControl } from "better-auth/plugins/access";
import { rateLimiter } from "hono-rate-limiter";

import {
  sendOrganizationInvitationEmailViaSteamify,
  sendPasswordResetEmailViaSteamify,
  sendVerificationEmailViaSteamify,
} from "../adapters/email";
import {
  normalizeEmailForLookup,
  shouldBlockCredentialSignUpForGoogleOnlyAccount,
} from "./duplicate-email-policy";
import {
  createStaffRoleEmailConfig,
  resolveStaffRoleAssignmentForEmail,
} from "./staff-role-policy";

const authOrigin = new URL(env.BETTER_AUTH_URL).origin;

// Rate-limit window/budget for authentication endpoints.
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX_REQUESTS = 100;

// Admin impersonation session lives 15 minutes by design.
const IMPERSONATION_SESSION_TTL_SECONDS = 60 * 15;

// Organization invitations expire after 48 hours.
const ORGANIZATION_INVITATION_TTL_SECONDS = 60 * 60 * 48;

const staffRoleEmailConfig = createStaffRoleEmailConfig({
  adminEmail: env.ADMIN_EMAIL,
  managerEmail: env.MANAGER_EMAIL,
});

const isE2ETestHelpersEnabled = env.ENABLE_E2E_TEST_HELPERS === "1";

export const authRateLimiter = rateLimiter({
  keyGenerator: (c) => {
    const forwardedFor = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    return (
      forwardedFor || c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || "unknown"
    );
  },
  limit: AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: {
    code: "RATE_LIMITED",
    message: "Too many auth requests. Please try again later.",
  },
  skip: (c) => isE2ETestHelpersEnabled || c.req.method === "OPTIONS",
  standardHeaders: "draft-6",
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
});

const adminAccessControl = createAccessControl({
  session: ["list", "revoke", "delete"],
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "get",
    "update",
  ],
});

const staffRolePermissions = {
  ADMIN: adminAccessControl.newRole({
    session: ["list", "revoke", "delete"],
    user: [
      "create",
      "list",
      "set-role",
      "ban",
      "impersonate",
      "delete",
      "set-password",
      "get",
      "update",
    ],
  }),
  // MANAGER and USER are declared with no admin-plugin permissions on purpose.
  // Authorization for these roles is enforced at the API layer, not by the
  // Better Auth admin plugin.
  MANAGER: adminAccessControl.newRole({
    session: [],
    user: [],
  }),
  USER: adminAccessControl.newRole({
    session: [],
    user: [],
  }),
} as const;

const organizationAccessControl = createAccessControl(defaultStatements);

const teamMembershipRolePermissions = {
  TEAM_LEADER: organizationAccessControl.newRole({
    invitation: ["create", "cancel"],
    member: ["create", "update", "delete"],
    organization: ["update"],
  }),
  TEAM_MEMBER: organizationAccessControl.newRole({
    invitation: [],
    member: [],
    organization: [],
  }),
  TEAM_MENTOR: organizationAccessControl.newRole({
    invitation: ["create", "cancel"],
    member: ["create", "update", "delete"],
    organization: ["update"],
  }),
} as const;

interface AuthUser {
  email: string;
  emailVerified?: boolean;
  id: string;
  image?: string | null;
  name: string;
  systemRole?: string | null;
  userType?: string | null;
}

export interface AuthSession {
  session: {
    activeOrganizationId?: string | null;
    createdAt?: Date;
    expiresAt: Date;
    id: string;
    ipAddress?: string | null;
    token?: string;
    updatedAt?: Date;
    userAgent?: string | null;
    userId: string;
  };
  user: AuthUser & {
    emailVerified: boolean;
  };
}

interface ServerAuth {
  api: {
    adminUpdateUser(context: {
      body: {
        data: Record<string, unknown>;
        userId: string;
      };
      headers: Headers;
    }): Promise<AuthUser>;
    createUser(context: {
      body: {
        data?: Record<string, unknown>;
        email: string;
        name: string;
        password?: string;
        role?: string | string[];
      };
      headers: Headers;
    }): Promise<{
      user: AuthUser;
    }>;
    getSession(context: {
      headers: Headers | Record<string, string | string[] | undefined>;
    }): Promise<{ session: Record<string, unknown>; user: Record<string, unknown> } | null>;
  };
  handler(request: Request): Promise<Response>;
}

const authOptions: BetterAuthOptions = {
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
  },
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

      // Case-insensitive lookup: stored email casing is preserved by Better
      // Auth, but our policy treats addresses as case-insensitive.
      const [existingUser] = await db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(sql`lower(${user.email})`, email), isNull(user.deletedAt)))
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
  plugins: [
    admin({
      adminRoles: ["ADMIN"],
      bannedUserMessage: "Your account has been suspended. Contact NRC support for assistance.",
      defaultRole: "USER",
      impersonationSessionDuration: IMPERSONATION_SESSION_TTL_SECONDS,
      roles: staffRolePermissions,
      schema: {
        user: {
          fields: {
            role: "systemRole",
          },
        },
      },
    }),
    organization({
      ac: organizationAccessControl,
      allowUserToCreateOrganization: false,
      cancelPendingInvitationsOnReInvite: true,
      // Self-serve org creation is disabled; this role only applies when an
      // admin creates an organization on behalf of a mentor.
      creatorRole: "TEAM_MENTOR",
      disableOrganizationDeletion: true,
      invitationExpiresIn: ORGANIZATION_INVITATION_TTL_SECONDS,
      requireEmailVerificationOnInvitation: true,
      roles: teamMembershipRolePermissions,
      schema: {
        organization: {
          additionalFields: {
            teamNumber: {
              input: false,
              required: false,
              type: "string",
            },
          },
        },
        session: {
          fields: {
            activeOrganizationId: "activeOrganizationId",
          },
        },
      },
      sendInvitationEmail: async ({
        email,
        id,
        inviter,
        organization: invitedOrganization,
        role,
      }) => {
        // Use the first (primary) origin for email links when multiple origins are configured
        const primaryOrigin = env.CORS_ORIGIN.split(",")[0]?.trim() ?? env.CORS_ORIGIN;
        const invitationUrl = `${primaryOrigin}/auth/accept-invitation?invitationId=${encodeURIComponent(id)}`;
        const organizationTeamNumber =
          typeof (invitedOrganization as Record<string, unknown>).teamNumber === "string"
            ? ((invitedOrganization as Record<string, unknown>).teamNumber as string)
            : null;

        await sendOrganizationInvitationEmailViaSteamify({
          email,
          invitationUrl,
          inviter,
          organization: {
            name: invitedOrganization.name,
            teamNumber: organizationTeamNumber,
          },
          role,
        });
      },
    }),
  ],
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  trustedOrigins: [...env.CORS_ORIGIN.split(",").map((o) => o.trim()), authOrigin],
  user: {
    additionalFields: {
      systemRole: {
        input: false,
        required: false,
        type: "string",
      },
      userType: {
        input: false,
        required: false,
        type: "string",
      },
    },
  },
};

export const auth = betterAuth(authOptions) as unknown as ServerAuth;
