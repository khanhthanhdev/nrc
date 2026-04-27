import type {
  AuthAdminContext,
  ManagedAuthUser,
  SystemRole,
  UserType,
} from "@nrc-full/api/shared/context";

import { auth } from "./auth";

const mapManagedAuthUser = (value: {
  email: string;
  id: string;
  name: string;
  systemRole?: SystemRole | null;
  userType?: UserType | null;
}): ManagedAuthUser => ({
  email: value.email,
  id: value.id,
  name: value.name,
  systemRole: value.systemRole ?? null,
  userType: value.userType ?? null,
});

export const createAuthAdminContext = (headers: Headers): AuthAdminContext => ({
  createUser: async ({ email, name, password, systemRole, userType }) => {
    const result = await auth.api.createUser({
      body: {
        data: {
          userType,
        },
        email,
        name,
        password,
        role: systemRole,
      },
      headers,
    });

    return mapManagedAuthUser(result.user as ManagedAuthUser);
  },

  updateUser: async ({ name, systemRole, userId, userType }) => {
    const result = await auth.api.adminUpdateUser({
      body: {
        data: {
          name,
          role: systemRole,
          userType,
        },
        userId,
      },
      headers,
    });

    return mapManagedAuthUser(result as ManagedAuthUser);
  },
});
