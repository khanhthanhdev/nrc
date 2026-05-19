import { normalizeEmailForLookup } from "./duplicate-email-policy";

export type StaffSystemRole = "ADMIN" | "MANAGER";

export interface StaffRoleEmailEnvironment {
  adminEmail?: string | null;
  managerEmail?: string | null;
}

export interface StaffRoleEmailConfig {
  adminEmails: ReadonlySet<string>;
  managerEmails: ReadonlySet<string>;
}

export interface StaffRoleAssignment {
  systemRole: StaffSystemRole;
  userType: "STAFF";
}

const parseEmailAllowlist = (value: unknown): Set<string> => {
  if (typeof value !== "string") {
    return new Set();
  }

  const entries = value
    .split(",")
    .map((email) => normalizeEmailForLookup(email))
    .filter((email): email is string => email !== null);

  return new Set(entries);
};

export const createStaffRoleEmailConfig = (
  environment: StaffRoleEmailEnvironment,
): StaffRoleEmailConfig => ({
  adminEmails: parseEmailAllowlist(environment.adminEmail),
  managerEmails: parseEmailAllowlist(environment.managerEmail),
});

export const resolveStaffRoleAssignmentForEmail = (
  email: unknown,
  config: StaffRoleEmailConfig,
): StaffRoleAssignment | null => {
  const normalizedEmail = normalizeEmailForLookup(email);

  if (!normalizedEmail) {
    return null;
  }

  if (config.adminEmails.has(normalizedEmail)) {
    return {
      systemRole: "ADMIN",
      userType: "STAFF",
    };
  }

  if (config.managerEmails.has(normalizedEmail)) {
    return {
      systemRole: "MANAGER",
      userType: "STAFF",
    };
  }

  return null;
};
