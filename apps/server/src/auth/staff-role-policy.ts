import { normalizeEmailForLookup } from "./duplicate-email-policy";

export type StaffSystemRole = "ADMIN" | "MANAGER";

export interface StaffRoleEmailConfig {
  adminEmail?: string | null;
  managerEmail?: string | null;
}

export interface StaffRoleAssignment {
  systemRole: StaffSystemRole;
  userType: "STAFF";
}

const parseEmailAllowlist = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((email) => normalizeEmailForLookup(email))
    .filter((email): email is string => email !== null);
};

export const resolveStaffRoleAssignmentForEmail = (
  email: unknown,
  config: StaffRoleEmailConfig,
): StaffRoleAssignment | null => {
  const normalizedEmail = normalizeEmailForLookup(email);

  if (!normalizedEmail) {
    return null;
  }

  const adminEmails = parseEmailAllowlist(config.adminEmail);
  if (adminEmails.includes(normalizedEmail)) {
    return {
      systemRole: "ADMIN",
      userType: "STAFF",
    };
  }

  const managerEmails = parseEmailAllowlist(config.managerEmail);
  if (managerEmails.includes(normalizedEmail)) {
    return {
      systemRole: "MANAGER",
      userType: "STAFF",
    };
  }

  return null;
};
