import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { getSystemRole, isStaffSystemRole } from "@/lib/route-policy";

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

  const onSignOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signed out");
  };

  const displayName = session.data?.user.name.trim() || session.data?.user.email || "Account";

  return (
    <header className="sticky top-0 z-20 pt-4 sm:pt-6">
      <div className="flex min-h-16 items-center justify-between rounded-[24px] border border-white/70 bg-white/78 px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-base font-bold tracking-[-0.02em] text-[#172b4d]">
            NRC Hub
          </Link>

          <nav className="flex flex-wrap items-center gap-1.5">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeProps={{
                  className: "bg-[#eef3ff] text-[#172b4d]",
                }}
                className="nrc-pill px-3 py-2 text-sm font-medium text-[#6b778c] transition-colors hover:bg-[#f7f9fc] hover:text-[#172b4d]"
              >
                {label}
              </Link>
            ))}
            {isStaffSystemRole(getSystemRole(session.data)) && (
              <Link
                activeProps={{
                  className: "bg-[#eef3ff] text-[#172b4d]",
                }}
                className="nrc-pill px-3 py-2 text-sm font-medium text-[#6b778c] transition-colors hover:bg-[#f7f9fc] hover:text-[#172b4d]"
                to="/staff"
              >
                Staff
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session.data ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" type="button" variant="secondary">
                  {displayName}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="truncate font-medium text-[#6b778c]">
                  {session.data.user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">Account settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/teams/new">Create team</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void onSignOut()} variant="destructive">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
