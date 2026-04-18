import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { Button } from "./ui/button";

export default function Header() {
  const links = [
    { label: "Home", to: "/" },
    { label: "Auth", to: "/auth" },
    { label: "Onboarding", to: "/onboarding" },
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
          {session.data
            ? (
                <>
                  <span className="text-muted-foreground text-sm">{session.data.user.email}</span>
                  <Button onClick={onSignOut} size="sm" type="button" variant="outline">
                    Sign out
                  </Button>
                </>
              )
            : (
                <span className="text-muted-foreground text-sm">Not signed in</span>
              )}
        </div>
      </div>
      <hr />
    </div>
  );
}
