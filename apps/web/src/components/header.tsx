import { Link } from "@tanstack/react-router";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { getSystemRole, isAdminSystemRole, isStaffSystemRole } from "@/lib/route-policy";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const links = [
  { label: "Home", to: "/" },
  { label: "Auth", to: "/auth" },
  { label: "Onboarding", to: "/onboarding" },
  { label: "Teams", to: "/teams" },
  { label: "Register", to: "/register" },
] as const;

export default function Header() {
  const session = authClient.useSession();
  const isAdmin = isAdminSystemRole(getSystemRole(session.data));
  const isImpersonating = Boolean(
    (
      session.data?.session as
        | ({
            impersonatedBy?: string | null;
          } & object)
        | undefined
    )?.impersonatedBy,
  );

  const onSignOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signed out");
  };

  const onStopImpersonating = async () => {
    const { error } = await authClient.admin.stopImpersonating();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Returned to your admin session.");
  };

  const displayName = session.data?.user.name.trim() || session.data?.user.email || "Account";

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-border bg-background sm:-mx-6 lg:-mx-8">
      <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">
              N
            </span>
            <span className="flex flex-col">
              <span className="text-base font-semibold tracking-[-0.02em] text-foreground">NRC Hub</span>
              <span className="text-muted-foreground text-xs">Competition platform</span>
            </span>
          </Link>

          <nav className="hidden flex-wrap items-center gap-6 lg:flex">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeProps={{
                  className: "nrc-nav-link-active",
                }}
                className="nrc-nav-link px-0 py-0"
              >
                {label}
              </Link>
            ))}
            {isStaffSystemRole(getSystemRole(session.data)) && (
              <Link
                activeProps={{
                  className: "nrc-nav-link-active",
                }}
                className="nrc-nav-link px-0 py-0"
                to="/staff"
              >
                Staff
              </Link>
            )}
            {isAdmin && (
              <Link
                activeProps={{
                  className: "nrc-nav-link-active",
                }}
                className="nrc-nav-link px-0 py-0"
                to="/users"
              >
                Users
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isImpersonating && (
            <Button onClick={() => void onStopImpersonating()} size="sm" variant="outline">
              <ShieldAlert className="size-4" />
              Stop impersonating
            </Button>
          )}
          {session.data ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" type="button" variant="secondary">
                  {displayName}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="truncate font-medium">
                  {session.data.user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">Account settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/teams/new">Create team</Link>
                </DropdownMenuItem>
                {isImpersonating && (
                  <DropdownMenuItem onSelect={() => void onStopImpersonating()}>
                    Stop impersonating
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => void onSignOut()} variant="destructive">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Link className="text-foreground hidden text-sm font-medium sm:inline-flex" to="/auth">
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
