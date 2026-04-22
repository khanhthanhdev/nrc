import { account, db, staffRoleAssignmentLog, user } from "@nrc-full/db";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, exists, ilike, isNull, not, sql } from "drizzle-orm";

import type { AuthAdminContext, ManagedAuthUser, SystemRole, UserType } from "../../../shared/context.js";
import type {
  ManagedUserDirectoryEntry,
  ManagedUsersPage,
} from "../contracts/managed-users.js";
import type {
  CreateManagedUserInput,
  GetManagedUserInput,
  GetManagedUsersInput,
  ManagedUserSort,
  SaveManagedUserInput,
} from "../schemas/managed-users.js";

const EXAMPLE_EMAIL_PATTERN = "%@example.com";
const DEFAULT_NON_STAFF_USER_TYPE: Exclude<UserType, "STAFF"> = "PARTICIPANT";

const getManagedUserColumns = () => ({
  banExpires: user.banExpires,
  banReason: user.banReason,
  banned: user.banned,
  createdAt: user.createdAt,
  email: user.email,
  emailVerified: user.emailVerified,
  hasCredentialAccount: exists(
    db
      .select({ _: sql`1` })
      .from(account)
      .where(and(eq(account.userId, user.id), eq(account.providerId, "credential"))),
  ).mapWith(Boolean),
  id: user.id,
  image: user.image,
  name: user.name,
  systemRole: user.systemRole,
  updatedAt: user.updatedAt,
  userType: user.userType,
});

const toORPCError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof ORPCError) {
    return error;
  }

  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.length > 0
      ? error.message
      : fallbackMessage;

  const statusCandidate =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof error.statusCode === "number"
        ? error.statusCode
        : undefined;

  const code =
    statusCandidate === 400 || statusCandidate === 422
      ? "BAD_REQUEST"
      : statusCandidate === 401
        ? "UNAUTHORIZED"
        : statusCandidate === 403
          ? "FORBIDDEN"
          : statusCandidate === 404
            ? "NOT_FOUND"
            : statusCandidate === 409
              ? "CONFLICT"
              : "INTERNAL_SERVER_ERROR";

  return new ORPCError(code, { message });
};

const countValue = (value: number | string | null | undefined): number => Number(value ?? 0);

const getCurrentNonStaffUserType = (
  currentUserType?: UserType | null,
): Exclude<UserType, "STAFF"> =>
  currentUserType === "MENTOR" || currentUserType === "PARTICIPANT"
    ? currentUserType
    : DEFAULT_NON_STAFF_USER_TYPE;

export const resolvePersistedRoleState = ({
  currentUserType,
  targetSystemRole,
}: {
  currentUserType?: UserType | null;
  targetSystemRole: SystemRole;
}): {
  systemRole: SystemRole;
  userType: UserType;
} => {
  if (targetSystemRole === "ADMIN" || targetSystemRole === "MANAGER") {
    return {
      systemRole: targetSystemRole,
      userType: "STAFF",
    };
  }

  return {
    systemRole: "USER",
    userType: getCurrentNonStaffUserType(currentUserType),
  };
};

const buildManagedUsersConditions = ({
  input,
  mode = "default",
}: {
  input: GetManagedUsersInput;
  mode?: "default" | "example-only";
}) => {
  const conditions = [isNull(user.deletedAt)];
  const trimmedSearchValue = input.searchValue?.trim();

  if (trimmedSearchValue) {
    const pattern = `%${trimmedSearchValue}%`;
    conditions.push(
      input.searchField === "name" ? ilike(user.name, pattern) : ilike(user.email, pattern),
    );
  }

  if (input.roleFilter !== "all") {
    conditions.push(eq(user.systemRole, input.roleFilter));
  }

  if (input.statusFilter === "active") {
    conditions.push(eq(user.banned, false));
  }

  if (input.statusFilter === "banned") {
    conditions.push(eq(user.banned, true));
  }

  if (mode === "example-only") {
    conditions.push(ilike(user.email, EXAMPLE_EMAIL_PATTERN));
  } else if (mode === "default" && !input.includeExampleAccounts) {
    conditions.push(not(ilike(user.email, EXAMPLE_EMAIL_PATTERN)));
  }

  return conditions;
};

const getManagedUsersOrderBy = (sort: ManagedUserSort) => {
  if (sort === "updated") {
    return [desc(user.updatedAt), asc(user.id)] as const;
  }

  if (sort === "name") {
    return [asc(user.name), asc(user.id)] as const;
  }

  if (sort === "email") {
    return [asc(user.email), asc(user.id)] as const;
  }

  return [desc(user.createdAt), asc(user.id)] as const;
};

const getManagedUserRecord = async (userId: string): Promise<ManagedUserDirectoryEntry | null> => {
  const [existingUser] = await db
    .select(getManagedUserColumns())
    .from(user)
    .where(and(eq(user.id, userId), isNull(user.deletedAt)))
    .limit(1);

  return existingUser ?? null;
};

const requireExistingUser = async (userId: string): Promise<ManagedUserDirectoryEntry> => {
  const existingUser = await getManagedUserRecord(userId);

  if (!existingUser) {
    throw new ORPCError("NOT_FOUND", {
      message: "User profile not found.",
    });
  }

  return existingUser;
};

const ensureEditableManagedUser = (targetUser: { id: string; systemRole: SystemRole }, actorUserId: string) => {
  if (targetUser.id === actorUserId) {
    throw new ORPCError("FORBIDDEN", {
      message:
        "Your own admin account is locked in this workspace. Use Account settings for personal changes.",
    });
  }

  if (targetUser.systemRole === "ADMIN") {
    throw new ORPCError("FORBIDDEN", {
      message: "Other admin accounts are read-only here under the strict-safety rule.",
    });
  }
};

const createStaffRoleAssignmentAuditEntry = async ({
  actorUserId,
  newSystemRole,
  oldSystemRole,
  targetUserId,
}: {
  actorUserId: string;
  newSystemRole: SystemRole;
  oldSystemRole: SystemRole;
  targetUserId: string;
}) => {
  if (oldSystemRole === newSystemRole) {
    return;
  }

  await db.insert(staffRoleAssignmentLog).values({
    actorUserId,
    id: crypto.randomUUID(),
    newSystemRole,
    oldSystemRole,
    reason: "Updated through the admin user console.",
    targetUserId,
  });
};

export const listManagedUsersForAdmin = async (
  input: GetManagedUsersInput,
): Promise<ManagedUsersPage> => {
  const whereClause = and(...buildManagedUsersConditions({ input }));
  const summaryRowPromise = db
    .select({
      adminCount: sql<number>`cast(coalesce(sum(case when ${user.systemRole} = 'ADMIN' then 1 else 0 end), 0) as integer)`,
      bannedCount: sql<number>`cast(coalesce(sum(case when ${user.banned} = true then 1 else 0 end), 0) as integer)`,
      managerCount: sql<number>`cast(coalesce(sum(case when ${user.systemRole} = 'MANAGER' then 1 else 0 end), 0) as integer)`,
      total: sql<number>`cast(count(*) as integer)`,
      userCount: sql<number>`cast(coalesce(sum(case when ${user.systemRole} = 'USER' then 1 else 0 end), 0) as integer)`,
    })
    .from(user)
    .where(whereClause);
  const hiddenExampleCountPromise = input.includeExampleAccounts
    ? Promise.resolve(0)
    : db
        .select({
          total: sql<number>`cast(count(*) as integer)`,
        })
        .from(user)
        .where(and(...buildManagedUsersConditions({ input, mode: "example-only" })))
        .then((rows) => countValue(rows[0]?.total));

  const rowsPromise = db
    .select(getManagedUserColumns())
    .from(user)
    .where(whereClause)
    .orderBy(...getManagedUsersOrderBy(input.sort))
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize);

  const [[summaryRow], hiddenExampleAccountCount, rows] = await Promise.all([
    summaryRowPromise,
    hiddenExampleCountPromise,
    rowsPromise,
  ]);

  return {
    counts: {
      admins: countValue(summaryRow?.adminCount),
      banned: countValue(summaryRow?.bannedCount),
      managers: countValue(summaryRow?.managerCount),
      users: countValue(summaryRow?.userCount),
    },
    hiddenExampleAccountCount,
    page: input.page,
    pageSize: input.pageSize,
    total: countValue(summaryRow?.total),
    users: rows,
  };
};

export const getManagedUserForAdmin = async (
  input: GetManagedUserInput,
): Promise<ManagedUserDirectoryEntry> => requireExistingUser(input.userId);

const requireAuthAdmin = (authAdmin: AuthAdminContext | undefined): AuthAdminContext => {
  if (!authAdmin) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Admin auth context is unavailable.",
    });
  }

  return authAdmin;
};

export const createManagedUserForAdmin = async (
  authAdmin: AuthAdminContext | undefined,
  input: CreateManagedUserInput,
): Promise<ManagedAuthUser> => {
  const adminAuth = requireAuthAdmin(authAdmin);
  const persistedRoleState = resolvePersistedRoleState({
    targetSystemRole: input.systemRole,
  });

  try {
    return await adminAuth.createUser({
      email: input.email,
      name: input.name,
      password: input.password,
      systemRole: persistedRoleState.systemRole,
      userType: persistedRoleState.userType,
    });
  } catch (error) {
    throw toORPCError(error, "Unable to create user.");
  }
};

export const saveManagedUserForAdmin = async ({
  actorUserId,
  authAdmin,
  input,
}: {
  actorUserId: string;
  authAdmin: AuthAdminContext | undefined;
  input: SaveManagedUserInput;
}): Promise<ManagedAuthUser> => {
  const adminAuth = requireAuthAdmin(authAdmin);
  const existingUser = await requireExistingUser(input.userId);

  ensureEditableManagedUser(existingUser, actorUserId);

  const persistedRoleState = resolvePersistedRoleState({
    currentUserType: existingUser.userType,
    targetSystemRole: input.systemRole,
  });

  try {
    const updatedUser = await adminAuth.updateUser({
      name: input.name,
      systemRole: persistedRoleState.systemRole,
      userId: input.userId,
      userType: persistedRoleState.userType,
    });

    await createStaffRoleAssignmentAuditEntry({
      actorUserId,
      newSystemRole: persistedRoleState.systemRole,
      oldSystemRole: existingUser.systemRole,
      targetUserId: input.userId,
    });

    return updatedUser;
  } catch (error) {
    throw toORPCError(error, "Unable to save the user profile.");
  }
};
