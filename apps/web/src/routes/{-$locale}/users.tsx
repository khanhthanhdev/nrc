import { useEffect, useState } from "react";

import type {
  ManagedUserDirectoryEntry,
  ManagedUsersPage,
} from "@nrc-full/api/features/auth/contracts/managed-users";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Ban,
  CalendarClock,
  Eye,
  KeyRound,
  MoreHorizontal,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { client } from "@/utils/orpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getSystemRole, isAdminSystemRole } from "@/lib/route-policy";
import type { SystemRole } from "@/lib/route-policy";

const PAGE_SIZE = 20;
const DEFAULT_BAN_DURATION = "604800";
const BAN_DURATION_OPTIONS = [
  { label: "Permanent", value: "permanent" },
  { label: "24 hours", value: "86400" },
  { label: "7 days", value: "604800" },
  { label: "30 days", value: "2592000" },
] as const;
const SORT_OPTIONS = {
  email: {
    label: "Email A-Z",
    sortBy: "email",
    sortDirection: "asc",
  },
  name: {
    label: "Name A-Z",
    sortBy: "name",
    sortDirection: "asc",
  },
  newest: {
    label: "Newest first",
    sortBy: "createdAt",
    sortDirection: "desc",
  },
  updated: {
    label: "Recently updated",
    sortBy: "updatedAt",
    sortDirection: "desc",
  },
} as const;

type SearchField = "email" | "name";
type StatusFilter = "all" | "active" | "banned";
type SortOption = keyof typeof SORT_OPTIONS;
type ConfirmAction = "ban" | "unban" | "impersonate" | "revokeSessions" | "remove" | null;
type ManagedUser = ManagedUserDirectoryEntry;
type ManagedUsersPageResult = ManagedUsersPage;

interface ManagedUserSession {
  id: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface ListUserSessionsResult {
  sessions: ManagedUserSession[];
}

interface CreateUserFormState {
  email: string;
  name: string;
  password: string;
  role: SystemRole;
}

const emptyCreateUserForm = (): CreateUserFormState => ({
  email: "",
  name: "",
  password: "",
  role: "USER",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const shortDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

const unwrapAuthResponse = <T,>(response: {
  data: T | null;
  error: { message?: string | null } | null;
}): T => {
  if (response.error) {
    throw new Error(response.error.message || "Request failed.");
  }

  if (response.data === null) {
    throw new Error("Request returned no data.");
  }

  return response.data;
};

const getUserRole = (user?: ManagedUser | null): SystemRole => {
  if (user?.systemRole === "ADMIN") {
    return "ADMIN";
  }

  if (user?.systemRole === "MANAGER") {
    return "MANAGER";
  }

  return "USER";
};

const isBanned = (user?: ManagedUser | null): boolean => Boolean(user?.banned);

const isLockedTarget = (user: ManagedUser, currentUserId: string): boolean =>
  user.id === currentUserId || getUserRole(user) === "ADMIN";

const getLockMessage = (user: ManagedUser, currentUserId: string): string | null => {
  if (user.id === currentUserId) {
    return "Your own admin account is locked in this workspace. Use Account settings for personal changes.";
  }

  if (getUserRole(user) === "ADMIN") {
    return "Other admin accounts are read-only here under the strict-safety rule.";
  }

  return null;
};

const getBanSummary = (user: ManagedUser): string => {
  if (!isBanned(user)) {
    return "Active";
  }

  const expiry = user.banExpires
    ? shortDateFormatter.format(new Date(user.banExpires))
    : "No expiry";
  return `Banned until ${expiry}`;
};

const formatDateTime = (value?: Date | string | null): string => {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return dateTimeFormatter.format(parsed);
};

const getInitials = (user: ManagedUser): string =>
  user.name
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || user.email.slice(0, 2).toUpperCase();

const generatePassword = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  if (!globalThis.crypto?.getRandomValues) {
    return `Nrc-${Math.random().toString(36).slice(2, 12)}!`;
  }

  const values = new Uint32Array(16);
  globalThis.crypto.getRandomValues(values);

  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
};

const MetricCard = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "accent";
  value: string;
}) => (
  <div
    className={cn(
      "nrc-card-subtle space-y-2 px-4 py-4",
      tone === "accent" && "border-primary/20 bg-primary/5",
    )}
  >
    <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{label}</p>
    <p className="text-foreground text-2xl font-semibold tracking-[-0.04em]">{value}</p>
  </div>
);

const UserIdentity = ({ user }: { user: ManagedUser }) => (
  <div className="flex items-center gap-3">
    <Avatar size="lg">
      <AvatarImage alt={user.name} src={user.image || undefined} />
      <AvatarFallback>{getInitials(user)}</AvatarFallback>
    </Avatar>

    <div className="min-w-0">
      <p className="text-foreground truncate text-sm font-semibold">{user.name}</p>
      <p className="text-muted-foreground truncate text-xs">{user.email}</p>
    </div>
  </div>
);

const RoleBadge = ({ user }: { user: ManagedUser }) => {
  const role = getUserRole(user);

  if (role === "ADMIN") {
    return <Badge className="bg-foreground text-background hover:bg-foreground">{role}</Badge>;
  }

  if (role === "MANAGER") {
    return <Badge variant="secondary">{role}</Badge>;
  }

  return <Badge variant="outline">{role}</Badge>;
};

const UserStateBadges = ({ user }: { user: ManagedUser }) => (
  <div className="flex flex-wrap gap-2">
    <RoleBadge user={user} />
    <Badge variant={user.emailVerified ? "secondary" : "outline"}>
      {user.emailVerified ? "Verified" : "Unverified"}
    </Badge>
    <Badge variant={isBanned(user) ? "destructive" : "outline"}>
      {isBanned(user) ? "Banned" : "Active"}
    </Badge>
  </div>
);

const useDebouncedValue = (value: string, delayMs: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, value]);

  return debouncedValue;
};

const getImpersonatedBy = (value: unknown): string | null => {
  if (!value || typeof value !== "object" || !("impersonatedBy" in value)) {
    return null;
  }

  const { impersonatedBy } = value as { impersonatedBy?: unknown };

  return typeof impersonatedBy === "string" && impersonatedBy.length > 0 ? impersonatedBy : null;
};

const applyManagedUserPatch = (
  user: ManagedUser,
  patch: Partial<ManagedUser> | ((currentUser: ManagedUser) => Partial<ManagedUser>),
): ManagedUser => ({
  ...user,
  ...(typeof patch === "function" ? patch(user) : patch),
});

const updateManagedUsersPageUser = (
  pageData: ManagedUsersPageResult | undefined,
  userId: string,
  patch: Partial<ManagedUser> | ((currentUser: ManagedUser) => Partial<ManagedUser>),
): ManagedUsersPageResult | undefined => {
  if (!pageData) {
    return pageData;
  }

  let didChange = false;
  const users = pageData.users.map((user) => {
    if (user.id !== userId) {
      return user;
    }

    didChange = true;
    return applyManagedUserPatch(user, patch);
  });

  return didChange ? { ...pageData, users } : pageData;
};

const updateManagedUsersPageBanState = (
  pageData: ManagedUsersPageResult | undefined,
  userId: string,
  nextState: Pick<ManagedUser, "banExpires" | "banReason" | "banned">,
): ManagedUsersPageResult | undefined => {
  if (!pageData) {
    return pageData;
  }

  let bannedDelta = 0;

  const nextPageData = updateManagedUsersPageUser(pageData, userId, (user) => {
    if (Boolean(user.banned) !== nextState.banned) {
      bannedDelta = nextState.banned ? 1 : -1;
    }

    return nextState;
  });

  if (!nextPageData || bannedDelta === 0) {
    return nextPageData;
  }

  return {
    ...nextPageData,
    counts: {
      ...nextPageData.counts,
      banned: Math.max(0, nextPageData.counts.banned + bannedDelta),
    },
  };
};

// eslint-disable-next-line complexity
export const UsersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const currentSession = session.data;
  const currentUserId = currentSession?.user.id ?? "";
  const isAdmin = isAdminSystemRole(getSystemRole(currentSession));
  const impersonatedBy = getImpersonatedBy(currentSession?.session);
  const isImpersonating = Boolean(impersonatedBy);

  const [searchValue, setSearchValue] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("email");
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [roleFilter, setRoleFilter] = useState<SystemRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmUser, setConfirmUser] = useState<ManagedUser | null>(null);
  const [createUserForm, setCreateUserForm] = useState<CreateUserFormState>(emptyCreateUserForm);
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState<SystemRole>("USER");
  const [newPassword, setNewPassword] = useState("");
  const [showDetailPassword, setShowDetailPassword] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<string>(DEFAULT_BAN_DURATION);
  const [removeConfirmation, setRemoveConfirmation] = useState("");

  const debouncedSearchValue = useDebouncedValue(searchValue.trim(), 250);

  const managedUsersInput = {
    includeExampleAccounts: showTestAccounts,
    page,
    pageSize: PAGE_SIZE,
    roleFilter,
    searchField,
    searchValue: debouncedSearchValue || undefined,
    sort: sortOption,
    statusFilter,
  } as const;

  const usersQuery = useQuery({
    enabled: isAdmin,
    placeholderData: keepPreviousData,
    queryFn: (): Promise<ManagedUsersPageResult> => client.auth.getManagedUsers(managedUsersInput),
    queryKey: ["admin", "managed-users", managedUsersInput],
  });

  const selectedUserQuery = useQuery({
    enabled: isAdmin && detailDialogOpen && Boolean(selectedUserId),
    queryFn: (): Promise<ManagedUser> => {
      if (!selectedUserId) {
        throw new Error("User id is required.");
      }

      return client.auth.getManagedUser({ userId: selectedUserId });
    },
    queryKey: ["admin", "user", selectedUserId],
  });

  const selectedUserSessionsQuery = useQuery({
    enabled: isAdmin && detailDialogOpen && Boolean(selectedUserId),
    queryFn: async () => {
      if (!selectedUserId) {
        throw new Error("User id is required.");
      }

      return unwrapAuthResponse<ListUserSessionsResult>(
        await authClient.admin.listUserSessions({ userId: selectedUserId }),
      );
    },
    queryKey: ["admin", "user-sessions", selectedUserId],
  });

  const directoryUsers = usersQuery.data?.users ?? [];
  const totalVisibleUsers = usersQuery.data?.total ?? 0;
  const visibleUsers = directoryUsers;
  const hiddenTestAccountCount = usersQuery.data?.hiddenExampleAccountCount ?? 0;
  const selectedUser =
    selectedUserQuery.data || directoryUsers.find((user) => user.id === selectedUserId) || null;
  const selectedUserSessions = selectedUserSessionsQuery.data?.sessions ?? [];
  const selectedUserLocked = selectedUser ? isLockedTarget(selectedUser, currentUserId) : true;
  const lockedMessage =
    selectedUser && currentUserId ? getLockMessage(selectedUser, currentUserId) : null;
  const totalPages = Math.max(1, Math.ceil(totalVisibleUsers / PAGE_SIZE));
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const adminCount = usersQuery.data?.counts.admins ?? 0;
  const managerCount = usersQuery.data?.counts.managers ?? 0;
  const memberCount = usersQuery.data?.counts.users ?? 0;
  const bannedCount = usersQuery.data?.counts.banned ?? 0;

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    setProfileName(selectedUser.name);
    setProfileRole(getUserRole(selectedUser));
    setBanReason(selectedUser.banReason || "");
    setBanDuration(DEFAULT_BAN_DURATION);
    setNewPassword("");
    setShowDetailPassword(false);
    setRemoveConfirmation("");
  }, [selectedUser]);

  const refreshAdminQueries = async (userId?: string | null) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "managed-users"] }),
      userId ? queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] }) : null,
      userId
        ? queryClient.invalidateQueries({ queryKey: ["admin", "user-sessions", userId] })
        : null,
    ]);
    void session.refetch();
  };

  const onMutationError = (error: unknown, fallbackMessage = "Something went wrong.") => {
    const message = error instanceof Error ? error.message : fallbackMessage;
    toast.error(message);
  };

  const openDetails = (userId: string) => {
    setSelectedUserId(userId);
    setDetailDialogOpen(true);
    setConfirmAction(null);
    setConfirmUser(null);
  };

  const openConfirmation = (action: Exclude<ConfirmAction, null>, user: ManagedUser) => {
    setConfirmAction(action);
    setConfirmUser(user);
    setSelectedUserId(user.id);
  };

  const stopImpersonatingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.admin.stopImpersonating();

      if (error) {
        throw new Error(error.message || "Unable to return to the admin session.");
      }
    },
    onError: (error) => onMutationError(error, "Unable to return to the admin session."),
    onSuccess: async () => {
      toast.success("Returned to your admin session.");
      await session.refetch();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (formState: CreateUserFormState) =>
      client.auth.createManagedUser({
        email: formState.email.trim(),
        name: formState.name.trim(),
        password: formState.password,
        systemRole: formState.role,
      }),
    onError: (error) => onMutationError(error, "Unable to create the user."),
    onSuccess: async (created) => {
      toast.success(`Created ${created.email}.`);
      setCreateDialogOpen(false);
      setCreateUserForm(emptyCreateUserForm());
      await refreshAdminQueries(created.id);
      openDetails(created.id);
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (userToSave: ManagedUser) => {
      if (isLockedTarget(userToSave, currentUserId)) {
        throw new Error("Protected admin accounts are read-only in this workspace.");
      }

      await client.auth.saveManagedUser({
        name: profileName.trim(),
        systemRole: profileRole,
        userId: userToSave.id,
      });
    },
    onError: (error) => onMutationError(error, "Unable to save the user profile."),
    onSuccess: async (_result, userToSave) => {
      toast.success("User profile saved.");
      await refreshAdminQueries(userToSave.id);
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (userToUpdate: ManagedUser) => {
      if (isLockedTarget(userToUpdate, currentUserId)) {
        throw new Error("Protected admin accounts cannot be updated from this page.");
      }

      const result = unwrapAuthResponse<{ status: boolean }>(
        await authClient.admin.setUserPassword({
          newPassword,
          userId: userToUpdate.id,
        }),
      );

      if (!result.status) {
        throw new Error("Password update did not complete.");
      }
    },
    onError: (error) => onMutationError(error, "Unable to update the password."),
    onSuccess: () => {
      setNewPassword("");
      setShowDetailPassword(false);
      toast.success("Password updated.");
    },
  });

  const confirmActionMutation = useMutation<
    undefined,
    Error,
    {
      action: Exclude<ConfirmAction, null>;
      user: ManagedUser;
    },
    {
      previousManagedUser?: ManagedUser;
      previousManagedUsers: [readonly unknown[], ManagedUsersPageResult | undefined][];
    }
  >({
    mutationFn: async ({ action, user: targetUser }) => {
      if (isLockedTarget(targetUser, currentUserId)) {
        throw new Error("Protected admin accounts cannot be changed from this page.");
      }

      if (action === "ban") {
        unwrapAuthResponse<{ user: unknown }>(
          await authClient.admin.banUser({
            banExpiresIn: banDuration === "permanent" ? undefined : Number(banDuration),
            banReason: banReason.trim() || undefined,
            userId: targetUser.id,
          }),
        );
      }

      if (action === "unban") {
        unwrapAuthResponse<{ user: unknown }>(
          await authClient.admin.unbanUser({
            userId: targetUser.id,
          }),
        );
      }

      if (action === "impersonate") {
        unwrapAuthResponse<{ session: unknown; user: unknown }>(
          await authClient.admin.impersonateUser({
            userId: targetUser.id,
          }),
        );
      }

      if (action === "revokeSessions") {
        const result = unwrapAuthResponse<{ success: boolean }>(
          await authClient.admin.revokeUserSessions({
            userId: targetUser.id,
          }),
        );

        if (!result.success) {
          throw new Error("Session revoke did not complete.");
        }
      }

      if (action === "remove") {
        const result = unwrapAuthResponse<{ success: boolean }>(
          await authClient.admin.removeUser({
            userId: targetUser.id,
          }),
        );

        if (!result.success) {
          throw new Error("User removal did not complete.");
        }
      }
    },
    onError: (error, variables, context) => {
      if (context?.previousManagedUsers) {
        for (const [queryKey, previousData] of context.previousManagedUsers) {
          queryClient.setQueryData(queryKey, previousData);
        }
      }

      if (context?.previousManagedUser) {
        queryClient.setQueryData(["admin", "user", variables.user.id], context.previousManagedUser);
      }

      onMutationError(error, "Unable to complete the requested admin action.");
    },
    onMutate: async ({ action, user: targetUser }) => {
      const isBanStateChange = action === "ban" || action === "unban";

      if (!isBanStateChange) {
        return {
          previousManagedUser: queryClient.getQueryData<ManagedUser>([
            "admin",
            "user",
            targetUser.id,
          ]),
          previousManagedUsers: [],
        };
      }

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["admin", "managed-users"] }),
        queryClient.cancelQueries({ queryKey: ["admin", "user", targetUser.id] }),
      ]);

      const nextBanState = {
        banExpires:
          action === "ban" && banDuration !== "permanent"
            ? new Date(Date.now() + Number(banDuration) * 1000)
            : null,
        banReason: action === "ban" ? banReason.trim() || null : null,
        banned: action === "ban",
      } as const;
      const previousManagedUsers = queryClient.getQueriesData<ManagedUsersPageResult>({
        queryKey: ["admin", "managed-users"],
      });
      const previousManagedUser = queryClient.getQueryData<ManagedUser>([
        "admin",
        "user",
        targetUser.id,
      ]);

      for (const [queryKey] of previousManagedUsers) {
        queryClient.setQueryData<ManagedUsersPageResult>(queryKey, (currentPageData) =>
          updateManagedUsersPageBanState(currentPageData, targetUser.id, nextBanState),
        );
      }

      queryClient.setQueryData<ManagedUser>(["admin", "user", targetUser.id], (currentUser) =>
        currentUser ? applyManagedUserPatch(currentUser, nextBanState) : currentUser,
      );

      return {
        previousManagedUser,
        previousManagedUsers,
      };
    },
    onSuccess: async (_result, { action, user: targetUser }) => {
      if (action === "ban") {
        toast.success(`Banned ${targetUser.email}.`);
      }

      if (action === "unban") {
        toast.success(`Unbanned ${targetUser.email}.`);
      }

      if (action === "revokeSessions") {
        toast.success(`Revoked active sessions for ${targetUser.email}.`);
      }

      if (action === "remove") {
        toast.success(`Removed ${targetUser.email}.`);
        setDetailDialogOpen(false);
      }

      if (action === "impersonate") {
        toast.success(`Now impersonating ${targetUser.email}.`);
        setConfirmAction(null);
        setConfirmUser(null);
        setDetailDialogOpen(false);
        await session.refetch();
        await navigate({ to: "/{-$locale}" });
        return;
      }

      setConfirmAction(null);
      setConfirmUser(null);
      await refreshAdminQueries(targetUser.id);
    },
  });

  const onCreateUser = async () => {
    await createUserMutation.mutateAsync(createUserForm);
  };

  const onSaveProfile = async () => {
    if (!selectedUser) {
      return;
    }

    await saveProfileMutation.mutateAsync(selectedUser);
  };

  const onSetPassword = async () => {
    if (!selectedUser) {
      return;
    }

    await setPasswordMutation.mutateAsync(selectedUser);
  };

  const onConfirmAction = async () => {
    if (!confirmAction || !confirmUser) {
      return;
    }

    await confirmActionMutation.mutateAsync({
      action: confirmAction,
      user: confirmUser,
    });
  };

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading admin user console...</p>
      </div>
    );
  }

  if (!session.data) {
    void navigate({ to: "/{-$locale}/auth" });

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  if (isImpersonating) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
        <div className="nrc-card space-y-3 px-6 py-6">
          <p className="text-foreground text-lg font-semibold tracking-[-0.03em]">
            Admin console is unavailable while impersonating.
          </p>
          <p className="text-muted-foreground text-sm leading-6">
            Return to your real admin session before managing users again. This keeps the page from
            loading with the impersonated account&apos;s permissions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={stopImpersonatingMutation.isPending}
              onClick={() => void stopImpersonatingMutation.mutateAsync()}
              size="sm"
              type="button"
            >
              {stopImpersonatingMutation.isPending ? "Returning..." : "Stop impersonating"}
            </Button>
            <Button
              onClick={() => void navigate({ to: "/{-$locale}" })}
              size="sm"
              type="button"
              variant="secondary"
            >
              Go to home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    void navigate({ to: "/{-$locale}/teams" });

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to the main workspace...</p>
      </div>
    );
  }

  const canConfirmRemove =
    confirmAction !== "remove" ||
    (Boolean(confirmUser) &&
      removeConfirmation.trim().toLowerCase() === (confirmUser?.email ?? "").trim().toLowerCase());

  return (
    <>
      <div className="mx-auto flex w-full max-w-310 flex-col gap-6 px-4 py-8">
        <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                Admin plugin powered
              </Badge>
              <div className="space-y-3">
                <h1 className="text-foreground max-w-3xl text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  Manage every account from one operational surface.
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6 sm:text-base">
                  Better Auth handles the authority model. This page adds search, profile edits,
                  role management, password resets, session control, bans, impersonation, and
                  removals with strict admin safety rails.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setCreateDialogOpen(true)} size="sm" type="button">
                  <UserPlus className="size-4" />
                  Create user
                </Button>
                <Button
                  onClick={() => {
                    setSearchValue("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                    setSearchField("email");
                    setShowTestAccounts(false);
                    setSortOption("newest");
                    setPage(1);
                  }}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Reset filters
                </Button>
              </div>
            </div>

            <div className="nrc-card-subtle p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                    Safety mode
                  </p>
                  <p className="text-foreground mt-2 text-lg font-semibold tracking-[-0.03em]">
                    Protected admin accounts stay read-only.
                  </p>
                </div>
                <div className="rounded-full border border-border bg-card p-3 text-foreground">
                  <ShieldAlert className="size-5" />
                </div>
              </div>

              <div className="text-muted-foreground mt-5 grid gap-3 text-sm">
                <div className="nrc-card px-4 py-3">
                  Your own account cannot be role-changed, banned, impersonated, or removed here.
                </div>
                <div className="nrc-card px-4 py-3">
                  Other `ADMIN` accounts are view-only in this console.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total users"
            tone="accent"
            value={String(usersQuery.data?.total ?? 0)}
          />
          <MetricCard label="Visible admins" value={String(adminCount)} />
          <MetricCard label="Visible managers" value={String(managerCount)} />
          <MetricCard label="Visible users" value={String(memberCount)} />
          <MetricCard label="Visible banned" value={String(bannedCount)} />
        </section>

        <section className="nrc-card overflow-hidden">
          <div className="border-b border-border px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                  User directory
                </p>
                <h2 className="text-foreground mt-2 text-xl font-semibold tracking-[-0.04em]">
                  Search, inspect, and act on accounts
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:flex xl:flex-wrap">
                <div className="relative min-w-62.5 flex-1 xl:min-w-72.5">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    className="h-11 rounded-md bg-background pl-10"
                    onChange={(event) => {
                      setSearchValue(event.target.value);
                      setPage(1);
                    }}
                    placeholder={searchField === "email" ? "Search by email" : "Search by name"}
                    value={searchValue}
                  />
                </div>

                <Select
                  onValueChange={(value) => {
                    setSearchField(value as SearchField);
                    setPage(1);
                  }}
                  value={searchField}
                >
                  <SelectTrigger className="h-11 w-full rounded-md bg-background px-4 md:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Search email</SelectItem>
                    <SelectItem value="name">Search name</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={(value) => {
                    setRoleFilter(value as SystemRole | "all");
                    setPage(1);
                  }}
                  value={roleFilter}
                >
                  <SelectTrigger className="h-11 w-full rounded-md bg-background px-4 md:w-37.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                    <SelectItem value="MANAGER">Managers</SelectItem>
                    <SelectItem value="USER">Users</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={(value) => {
                    setStatusFilter(value as StatusFilter);
                    setPage(1);
                  }}
                  value={statusFilter}
                >
                  <SelectTrigger className="h-11 w-full rounded-md bg-background px-4 md:w-37.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active only</SelectItem>
                    <SelectItem value="banned">Banned only</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={(value) => {
                    setSortOption(value as SortOption);
                    setPage(1);
                  }}
                  value={sortOption}
                >
                  <SelectTrigger className="h-11 w-full rounded-md bg-background px-4 md:w-45">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SORT_OPTIONS).map(([value, option]) => (
                      <SelectItem key={value} value={value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label
                  className="text-foreground flex h-11 min-w-55 items-center justify-between gap-3 rounded-md border border-input bg-background px-4 text-sm font-normal"
                  htmlFor="show-test-accounts"
                >
                  Include `@example.com`
                  <Switch
                    checked={showTestAccounts}
                    id="show-test-accounts"
                    onCheckedChange={(checked) => {
                      setShowTestAccounts(checked);
                      setPage(1);
                    }}
                  />
                </Label>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-3 pb-4">
              <p className="text-muted-foreground text-sm">
                Showing <span className="text-foreground font-semibold">{visibleUsers.length}</span>{" "}
                of <span className="text-foreground font-semibold">{totalVisibleUsers}</span> users.
              </p>
              <div className="hidden items-center gap-2 md:flex">
                <Badge variant="outline">
                  {searchField === "email" ? "Email search" : "Name search"}
                </Badge>
                {roleFilter !== "all" && <Badge variant="outline">{roleFilter}</Badge>}
                {statusFilter !== "all" && <Badge variant="outline">{statusFilter}</Badge>}
                {!showTestAccounts && hiddenTestAccountCount > 0 && (
                  <Badge variant="secondary">Hidden `@example.com`: {hiddenTestAccountCount}</Badge>
                )}
              </div>
            </div>

            {usersQuery.isPending && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton className="h-16 rounded-xl" key={index} />
                ))}
              </div>
            )}

            {usersQuery.error && (
              <div className="nrc-note-danger px-5 py-4 text-sm">{usersQuery.error.message}</div>
            )}

            {!usersQuery.isPending && !usersQuery.error && visibleUsers.length === 0 && (
              <Empty className="rounded-xl border-border bg-muted/40">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No users match the current filters</EmptyTitle>
                  <EmptyDescription>
                    Broaden the search or create a fresh account for a staff member, mentor, or team
                    lead.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setCreateDialogOpen(true)} size="sm" type="button">
                    <UserPlus className="size-4" />
                    Create user
                  </Button>
                </EmptyContent>
              </Empty>
            )}

            {!usersQuery.isPending && !usersQuery.error && visibleUsers.length > 0 && (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-border md:block">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="w-18 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleUsers.map((user) => {
                        const lockedTarget = isLockedTarget(user, currentUserId);

                        return (
                          <TableRow
                            className="cursor-pointer bg-card hover:bg-muted/50"
                            key={user.id}
                            onClick={() => openDetails(user.id)}
                          >
                            <TableCell>
                              <UserIdentity user={user} />
                            </TableCell>
                            <TableCell>
                              <RoleBadge user={user} />
                            </TableCell>
                            <TableCell>
                              <UserStateBadges user={user} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {formatDateTime(user.createdAt)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {formatDateTime(user.updatedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    className="ml-auto"
                                    onClick={(event) => event.stopPropagation()}
                                    size="icon-sm"
                                    type="button"
                                    variant="ghost"
                                  >
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Open user actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => openDetails(user.id)}>
                                    <Eye className="size-4" />
                                    View profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={lockedTarget}
                                    onSelect={() => openConfirmation("impersonate", user)}
                                  >
                                    <Sparkles className="size-4" />
                                    Impersonate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={lockedTarget}
                                    onSelect={() =>
                                      openConfirmation(isBanned(user) ? "unban" : "ban", user)
                                    }
                                  >
                                    <Ban className="size-4" />
                                    {isBanned(user) ? "Unban account" : "Ban account"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={lockedTarget}
                                    onSelect={() => openConfirmation("revokeSessions", user)}
                                  >
                                    <CalendarClock className="size-4" />
                                    Revoke sessions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={lockedTarget}
                                    onSelect={() => openConfirmation("remove", user)}
                                    variant="destructive"
                                  >
                                    <Trash2 className="size-4" />
                                    Remove user
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-3 md:hidden">
                  {visibleUsers.map((user) => {
                    const lockedTarget = isLockedTarget(user, currentUserId);

                    return (
                      <div className="nrc-card-subtle space-y-4 px-4 py-4" key={user.id}>
                        <div className="flex items-start justify-between gap-3">
                          <UserIdentity user={user} />

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon-sm" type="button" variant="ghost">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => openDetails(user.id)}>
                                View profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={lockedTarget}
                                onSelect={() => openConfirmation("impersonate", user)}
                              >
                                Impersonate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={lockedTarget}
                                onSelect={() =>
                                  openConfirmation(isBanned(user) ? "unban" : "ban", user)
                                }
                              >
                                {isBanned(user) ? "Unban account" : "Ban account"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <UserStateBadges user={user} />

                        <div className="text-muted-foreground grid gap-2 text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <span>Created</span>
                            <span className="text-foreground text-right">
                              {formatDateTime(user.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Updated</span>
                            <span className="text-foreground text-right">
                              {formatDateTime(user.updatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Access</span>
                            <span className="text-foreground text-right">
                              {getBanSummary(user)}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => openDetails(user.id)}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          Open profile
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-5">
                  <Pagination className="justify-between">
                    <div className="text-muted-foreground text-sm">
                      Page <span className="text-foreground font-semibold">{page}</span> of{" "}
                      <span className="text-foreground font-semibold">{totalPages}</span>
                    </div>

                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          disabled={!canGoPrevious}
                          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          Previous
                        </Button>
                      </PaginationItem>
                      <PaginationItem>
                        <Button
                          disabled={!canGoNext}
                          onClick={() => setPage((currentPage) => currentPage + 1)}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          Next
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create a new user</DialogTitle>
            <DialogDescription>
              Provision an account directly through the Better Auth admin plugin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create-user-name">Full name</Label>
              <Input
                id="create-user-name"
                onChange={(event) =>
                  setCreateUserForm((currentForm) => ({
                    ...currentForm,
                    name: event.target.value,
                  }))
                }
                placeholder="Jordan Nguyen"
                value={createUserForm.name}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-user-email">Email</Label>
              <Input
                id="create-user-email"
                onChange={(event) =>
                  setCreateUserForm((currentForm) => ({
                    ...currentForm,
                    email: event.target.value,
                  }))
                }
                placeholder="jordan@example.com"
                type="email"
                value={createUserForm.email}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="create-user-password">Temporary password</Label>
                <Button
                  onClick={() =>
                    setCreateUserForm((currentForm) => ({
                      ...currentForm,
                      password: generatePassword(),
                    }))
                  }
                  size="xs"
                  type="button"
                  variant="ghost"
                >
                  Generate
                </Button>
              </div>
              <Input
                id="create-user-password"
                onChange={(event) =>
                  setCreateUserForm((currentForm) => ({
                    ...currentForm,
                    password: event.target.value,
                  }))
                }
                placeholder="At least 8 characters"
                type="text"
                value={createUserForm.password}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-user-role">Role</Label>
              <Select
                onValueChange={(value) =>
                  setCreateUserForm((currentForm) => ({
                    ...currentForm,
                    role: value as SystemRole,
                  }))
                }
                value={createUserForm.role}
              >
                <SelectTrigger className="h-11 w-full rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="MANAGER">MANAGER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={
                createUserMutation.isPending ||
                !createUserForm.email.trim() ||
                !createUserForm.name.trim() ||
                createUserForm.password.length < 8
              }
              onClick={() => void onCreateUser()}
              type="button"
            >
              {createUserMutation.isPending ? "Creating..." : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          setDetailDialogOpen(open);

          if (!open) {
            setSelectedUserId(null);
            setConfirmAction(null);
            setConfirmUser(null);
          }
        }}
        open={detailDialogOpen}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <div className="border-b border-border bg-muted/50 px-6 py-6">
            {selectedUser ? (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <UserIdentity user={selectedUser} />
                  <div className="flex flex-wrap gap-2">
                    <UserStateBadges user={selectedUser} />
                    <Badge variant="outline">User ID: {selectedUser.id.slice(0, 8)}</Badge>
                  </div>
                </div>

                <div className="nrc-card px-4 py-3 text-sm text-muted-foreground">
                  <p className="text-foreground font-semibold">Account timeline</p>
                  <p className="mt-2">Created {formatDateTime(selectedUser.createdAt)}</p>
                  <p>Updated {formatDateTime(selectedUser.updatedAt)}</p>
                </div>
              </div>
            ) : (
              <Skeleton className="h-24 rounded-xl" />
            )}
          </div>

          <div className="px-6 py-6">
            {selectedUserQuery.isPending && (
              <div className="space-y-4">
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
            )}

            {selectedUserQuery.error && (
              <div className="nrc-note-danger px-5 py-4 text-sm">
                {selectedUserQuery.error.message}
              </div>
            )}

            {!selectedUserQuery.isPending && !selectedUserQuery.error && selectedUser && (
              <div className="space-y-5">
                {lockedMessage && <div className="nrc-note px-5 py-4 text-sm">{lockedMessage}</div>}

                <Tabs defaultValue="overview">
                  <TabsList variant="line">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="access">Access</TabsTrigger>
                    <TabsTrigger value="danger">Danger zone</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="nrc-card-subtle space-y-4 px-5 py-5">
                        <div>
                          <h3 className="text-foreground text-lg font-semibold tracking-[-0.03em]">
                            Profile
                          </h3>
                          <p className="text-muted-foreground mt-1 text-sm">
                            Update the basic user record and assign the correct system role.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="detail-user-name">Full name</Label>
                            <Input
                              disabled={selectedUserLocked}
                              id="detail-user-name"
                              onChange={(event) => setProfileName(event.target.value)}
                              value={profileName}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="detail-user-email">Email</Label>
                            <Input id="detail-user-email" readOnly value={selectedUser.email} />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="detail-user-role">Role</Label>
                            <Select
                              disabled={selectedUserLocked}
                              onValueChange={(value) => setProfileRole(value as SystemRole)}
                              value={profileRole}
                            >
                              <SelectTrigger className="h-11 w-full rounded-md">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">USER</SelectItem>
                                <SelectItem value="MANAGER">MANAGER</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            disabled={
                              selectedUserLocked ||
                              saveProfileMutation.isPending ||
                              !profileName.trim()
                            }
                            onClick={() => void onSaveProfile()}
                            size="sm"
                            type="button"
                          >
                            {saveProfileMutation.isPending ? "Saving..." : "Save profile"}
                          </Button>
                        </div>
                      </div>

                      <div className="nrc-card-subtle space-y-4 px-5 py-5">
                        <div>
                          <h3 className="text-foreground text-lg font-semibold tracking-[-0.03em]">
                            Account summary
                          </h3>
                          <p className="text-muted-foreground mt-1 text-sm">
                            Useful signals for quick triage before you make changes.
                          </p>
                        </div>

                        <dl className="grid gap-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground">Access state</dt>
                            <dd className="text-foreground font-medium">
                              {getBanSummary(selectedUser)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground">Email verification</dt>
                            <dd className="text-foreground font-medium">
                              {selectedUser.emailVerified ? "Verified" : "Pending"}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground">Login method</dt>
                            <dd className="text-foreground font-medium">
                              {selectedUser.hasCredentialAccount
                                ? "Email + password"
                                : "External provider only"}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground">Sessions</dt>
                            <dd className="text-foreground font-medium">
                              {selectedUserSessionsQuery.isSuccess
                                ? selectedUserSessions.length
                                : "Loading..."}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="security">
                    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                      <div className="nrc-card-subtle space-y-4 px-5 py-5">
                        <div>
                          <h3 className="text-foreground text-lg font-semibold tracking-[-0.03em]">
                            Password reset
                          </h3>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {selectedUser.hasCredentialAccount
                              ? "Set a fresh password when a user loses access or needs an immediate reset."
                              : "Password management is not available for accounts that use external sign-in only (e.g. Google)."}
                          </p>
                        </div>

                        {selectedUser.hasCredentialAccount ? (
                          <>
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="detail-user-password">New password</Label>
                                <div className="flex items-center gap-2">
                                  <Button
                                    disabled={selectedUserLocked}
                                    onClick={() =>
                                      setShowDetailPassword((currentValue) => !currentValue)
                                    }
                                    size="xs"
                                    type="button"
                                    variant="ghost"
                                  >
                                    {showDetailPassword ? "Hide" : "Show"}
                                  </Button>
                                  <Button
                                    disabled={selectedUserLocked}
                                    onClick={() => {
                                      setNewPassword(generatePassword());
                                      setShowDetailPassword(true);
                                    }}
                                    size="xs"
                                    type="button"
                                    variant="ghost"
                                  >
                                    Generate
                                  </Button>
                                </div>
                              </div>
                              <Input
                                disabled={selectedUserLocked}
                                id="detail-user-password"
                                onChange={(event) => setNewPassword(event.target.value)}
                                type={showDetailPassword ? "text" : "password"}
                                value={newPassword}
                              />
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <Button
                                disabled={
                                  selectedUserLocked ||
                                  setPasswordMutation.isPending ||
                                  newPassword.length < 8
                                }
                                onClick={() => void onSetPassword()}
                                size="sm"
                                type="button"
                              >
                                <KeyRound className="size-4" />
                                {setPasswordMutation.isPending ? "Updating..." : "Set password"}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="nrc-note px-4 py-3 text-sm">
                            This user signed in with an external provider. Password reset and
                            generation are not available.
                          </div>
                        )}
                      </div>

                      <div className="nrc-card-subtle space-y-4 px-5 py-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-foreground text-lg font-semibold tracking-[-0.03em]">
                              Session control
                            </h3>
                            <p className="text-muted-foreground mt-1 text-sm">
                              Review active sessions before revoking all access.
                            </p>
                          </div>
                          <Button
                            disabled={selectedUserLocked || confirmActionMutation.isPending}
                            onClick={() => openConfirmation("revokeSessions", selectedUser)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            Revoke all
                          </Button>
                        </div>

                        {selectedUserSessionsQuery.isPending && (
                          <div className="space-y-3">
                            <Skeleton className="h-14 rounded-lg" />
                            <Skeleton className="h-14 rounded-lg" />
                          </div>
                        )}

                        {selectedUserSessionsQuery.error && (
                          <p className="text-destructive text-sm">
                            {selectedUserSessionsQuery.error.message}
                          </p>
                        )}

                        {!selectedUserSessionsQuery.isPending &&
                          !selectedUserSessionsQuery.error &&
                          selectedUserSessions.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                              No active sessions found.
                            </p>
                          )}

                        <div className="grid gap-3">
                          {selectedUserSessions.map((managedSession) => (
                            <div className="nrc-card px-4 py-4" key={managedSession.id}>
                              <div className="text-muted-foreground flex flex-col gap-2 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-foreground font-medium">
                                    {managedSession.userAgent || "Unknown device"}
                                  </span>
                                  <Badge variant="outline">
                                    Expires {formatDateTime(managedSession.expiresAt)}
                                  </Badge>
                                </div>
                                <p>{managedSession.ipAddress || "No IP recorded"}</p>
                                <p>Created {formatDateTime(managedSession.createdAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="access">
                    <div className="nrc-card-subtle space-y-4 px-5 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-foreground text-lg font-semibold tracking-[-0.03em]">
                            Ban controls and impersonation
                          </h3>
                          <p className="text-muted-foreground mt-1 text-sm">
                            Use a documented reason when removing access. Impersonation creates a
                            new admin session cookie.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={selectedUserLocked}
                            onClick={() => openConfirmation("impersonate", selectedUser)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            <Sparkles className="size-4" />
                            Impersonate
                          </Button>
                          <Button
                            disabled={selectedUserLocked}
                            onClick={() =>
                              openConfirmation(
                                isBanned(selectedUser) ? "unban" : "ban",
                                selectedUser,
                              )
                            }
                            size="sm"
                            type="button"
                            variant={isBanned(selectedUser) ? "secondary" : "destructive"}
                          >
                            <Ban className="size-4" />
                            {isBanned(selectedUser) ? "Lift ban" : "Ban user"}
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                        <div className="grid gap-2">
                          <Label htmlFor="ban-reason">Ban reason</Label>
                          <Textarea
                            disabled={selectedUserLocked}
                            id="ban-reason"
                            onChange={(event) => setBanReason(event.target.value)}
                            placeholder="Document why access is being restricted."
                            rows={4}
                            value={banReason}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="ban-duration">Ban duration</Label>
                          <Select
                            disabled={selectedUserLocked}
                            onValueChange={setBanDuration}
                            value={banDuration}
                          >
                            <SelectTrigger className="h-11 w-full rounded-md">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BAN_DURATION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="nrc-note px-4 py-4 text-sm">
                        <p className="text-foreground font-medium">Current status</p>
                        <p className="mt-2">{getBanSummary(selectedUser)}</p>
                        {selectedUser.banReason && (
                          <p className="mt-2">Reason: {selectedUser.banReason}</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="danger">
                    <div className="nrc-note-danger space-y-4 px-5 py-5">
                      <div>
                        <h3 className="text-foreground text-lg font-semibold tracking-[-0.03em]">
                          Permanent removal
                        </h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                          This removes the user record and associated sessions. Type the user email
                          to unlock the remove action.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="remove-confirmation">Confirm email</Label>
                        <Input
                          disabled={selectedUserLocked}
                          id="remove-confirmation"
                          onChange={(event) => setRemoveConfirmation(event.target.value)}
                          placeholder={selectedUser.email}
                          value={removeConfirmation}
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          disabled={
                            selectedUserLocked ||
                            removeConfirmation.trim().toLowerCase() !==
                              selectedUser.email.trim().toLowerCase()
                          }
                          onClick={() => openConfirmation("remove", selectedUser)}
                          size="sm"
                          type="button"
                          variant="destructive"
                        >
                          <Trash2 className="size-4" />
                          Remove user
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setConfirmUser(null);
          }
        }}
        open={Boolean(confirmAction && confirmUser)}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "ban" && "Ban account"}
              {confirmAction === "unban" && "Lift account ban"}
              {confirmAction === "impersonate" && "Start impersonation"}
              {confirmAction === "revokeSessions" && "Revoke all sessions"}
              {confirmAction === "remove" && "Remove user"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "ban" &&
                `This will immediately block ${confirmUser?.email} and revoke their active sessions.`}
              {confirmAction === "unban" && `This restores login access for ${confirmUser?.email}.`}
              {confirmAction === "impersonate" &&
                `This swaps your current session into ${confirmUser?.email}. Use the header action to return.`}
              {confirmAction === "revokeSessions" &&
                `This signs ${confirmUser?.email} out everywhere without changing the account record.`}
              {confirmAction === "remove" &&
                `This permanently deletes ${confirmUser?.email} and cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          {confirmAction === "ban" && (
            <div className="nrc-note px-4 py-4 text-sm">
              <p className="text-foreground font-medium">Ban configuration</p>
              <p className="mt-2">Reason: {banReason.trim() || "No reason provided"}</p>
              <p>
                Duration:{" "}
                {BAN_DURATION_OPTIONS.find((option) => option.value === banDuration)?.label ||
                  "Custom"}
              </p>
            </div>
          )}

          {confirmAction === "remove" && (
            <div className="nrc-note-danger px-4 py-4 text-sm">
              Type match required: <span className="font-semibold">{confirmUser?.email}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setConfirmAction(null);
                setConfirmUser(null);
              }}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={confirmActionMutation.isPending || !canConfirmRemove}
              onClick={() => void onConfirmAction()}
              type="button"
              variant={
                confirmAction === "remove" || confirmAction === "ban" ? "destructive" : "default"
              }
            >
              {confirmActionMutation.isPending ? "Working..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const LegacyUsersRedirectPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ replace: true, to: "/{-$locale}/staff/users" });
  }, [navigate]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-muted-foreground text-sm">Redirecting to the staff user console...</p>
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/users")({
  component: LegacyUsersRedirectPage,
});
