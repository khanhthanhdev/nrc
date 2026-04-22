import { env } from "@nrc-full/env/web";
import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

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

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
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
