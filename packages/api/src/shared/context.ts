export type SystemRole = "USER" | "MANAGER" | "ADMIN";
export type UserType = "PARTICIPANT" | "MENTOR" | "STAFF";

export interface AuthContextSession {
  session: {
    activeOrganizationId?: string | null;
    expiresAt: Date;
    id: string;
    userId: string;
  };
  user: {
    email: string;
    emailVerified: boolean;
    id: string;
    name: string;
    systemRole?: SystemRole | null;
    userType?: UserType | null;
  };
}

export interface ManagedAuthUser {
  email: string;
  id: string;
  name: string;
  systemRole?: SystemRole | null;
  userType?: UserType | null;
}

export interface AuthAdminContext {
  createUser(input: {
    email: string;
    name: string;
    password?: string;
    systemRole: SystemRole;
    userType: UserType;
  }): Promise<ManagedAuthUser>;
  updateUser(input: {
    name: string;
    systemRole: SystemRole;
    userId: string;
    userType: UserType;
  }): Promise<ManagedAuthUser>;
}

export interface Context {
  authAdmin?: AuthAdminContext;
  session: AuthContextSession | null;
}

export interface CreateContextOptions {
  authAdmin?: AuthAdminContext;
  session: AuthContextSession | null;
}

export const createContext = async (opts: CreateContextOptions): Promise<Context> => ({
  authAdmin: opts.authAdmin,
  session: opts.session,
});
