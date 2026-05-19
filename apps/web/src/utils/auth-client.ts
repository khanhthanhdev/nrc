import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";
import { getInternalApiUrl } from "./internal-api-url";

const organizationAccessControl = createAccessControl(defaultStatements);
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
  MANAGER: adminAccessControl.newRole({
    session: [],
    user: [],
  }),
  USER: adminAccessControl.newRole({
    session: [],
    user: [],
  }),
} as const;

const teamMembershipRoles = {
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

// Use a same-origin relative path so the browser never preflights and so
// cookies are scoped to the web domain. Caddy (prod) and Vite (dev) proxy
// /api/auth/* to the API container. SSR session fetching goes through a
// dedicated server function in utils/fetch-session.ts.
const authBaseURL = typeof window === "undefined" ? getInternalApiUrl() : window.location.origin;

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    inferAdditionalFields({
      user: {
        systemRole: {
          required: false,
          type: "string",
        },
        userType: {
          required: false,
          type: "string",
        },
      },
    }),
    adminClient({
      ac: adminAccessControl,
      roles: staffRolePermissions,
    }),
    organizationClient({
      ac: organizationAccessControl,
      roles: teamMembershipRoles,
    }),
  ],
});

export type AuthSession = typeof authClient.$Infer.Session;
