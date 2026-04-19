import { Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck, Trophy } from "lucide-react";
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

const links = [
  { label: "Dashboard", to: "/" },
  { label: "Auth", to: "/auth" },
  { label: "Onboarding", to: "/onboarding" },
  { label: "My Team", to: "/teams/my" },
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
      <div className="nrc-card flex flex-col gap-5 px-5 py-5 backdrop-blur sm:px-7 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#447aff_0%,#7a5af8_60%,#ee46bc_100%)] text-white shadow-[rgba(41,41,41,0.26)_0px_10px_20px_-10px]">
            <Trophy className="size-7" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[0.75rem] font-bold tracking-[0.24em] text-[#6b778c] uppercase">
                National Robotics Competition
              </p>
              <span className="nrc-pill bg-[#ee46bc] px-3 py-1 text-[0.7rem] font-bold tracking-[0.18em] text-white uppercase">
                Live Ops
              </span>
            </div>
            <div>
              <Link to="/" className="text-2xl font-extrabold tracking-[-0.03em] text-[#172b4d]">
                NRC Control Center
              </Link>
              <p className="max-w-2xl text-sm text-[#6b778c] sm:text-base">
                Competition operations, registrations, and team progress in one kinetic tournament
                workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <nav className="flex flex-wrap gap-2">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeProps={{
                  className:
                    "bg-[linear-gradient(135deg,#447aff_0%,#7a5af8_100%)] text-white shadow-[rgba(41,41,41,0.26)_0px_10px_20px_-10px]",
                }}
                className="nrc-pill inline-flex items-center gap-2 border border-[#d8e0ec] bg-white px-4 py-2 text-sm font-semibold text-[#172b4d] transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#447aff]/30 hover:bg-[#eef3ff]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <div className="nrc-pill flex items-center gap-2 border border-[#d8e0ec] bg-white px-4 py-2 text-sm text-[#6b778c]">
              <ShieldCheck className="size-4 text-[#447aff]" />
              <span className="font-medium">
                {session.data ? "Authenticated" : "Guest session"}
              </span>
            </div>
            {session.data ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" type="button" variant="outline">
                    {displayName}
                    <ChevronRight className="size-4 rotate-90" />
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
              <Button asChild size="lg">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
