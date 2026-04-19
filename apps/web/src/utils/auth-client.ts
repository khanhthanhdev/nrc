import { env } from "@nrc-full/env/web";
import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const organizationAccessControl = createAccessControl(defaultStatements);

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
    adminClient(),
    organizationClient({
      ac: organizationAccessControl,
      roles: teamMembershipRoles,
    }),
  ],
});

export type AuthSession = typeof authClient.$Infer.Session;
