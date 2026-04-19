import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Header() {
  const links = [
    { label: "Home", to: "/" },
    { label: "Auth", to: "/auth" },
    { label: "Onboarding", to: "/onboarding" },
    { label: "My Team", to: "/teams/my" },
  ] as const;

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
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session.data ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" type="button" variant="outline">
                  {displayName}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="truncate">
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
            <span className="text-muted-foreground text-sm">Not signed in</span>
          )}
        </div>
      </div>
      <hr />
    </div>
  );
}
