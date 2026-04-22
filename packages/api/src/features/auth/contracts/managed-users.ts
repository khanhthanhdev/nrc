import type { SystemRole, UserType } from "../../../shared/context.js";

export interface ManagedUserDirectoryEntry {
  banExpires: Date | null;
  banReason: string | null;
  banned: boolean;
  createdAt: Date;
  email: string;
  emailVerified: boolean;
  hasCredentialAccount: boolean;
  id: string;
  image: string | null;
  name: string;
  systemRole: SystemRole;
  updatedAt: Date;
  userType: UserType;
}

export interface ManagedUsersPage {
  counts: {
    admins: number;
    banned: number;
    managers: number;
    users: number;
  };
  hiddenExampleAccountCount: number;
  page: number;
  pageSize: number;
  total: number;
  users: ManagedUserDirectoryEntry[];
}
