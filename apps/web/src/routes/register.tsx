import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { useCurrentTeamSummary } from "@/lib/team-access";
import { useRequireAuth } from "@/lib/route-guards";

const RegisterPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const teamQuery = useCurrentTeamSummary();

  useRequireAuth(session);

  if (pathname !== "/register") {
    return <Outlet />;
  }

  if (session.isPending || teamQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading registration...</p>
      </div>
    );
  }

  if (!session.data) {
    void navigate({ to: "/auth" });

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Register</h1>
        <p className="text-muted-foreground text-sm">
          Open `/register/:eventId` for event registration and `/register/:eventId/:registrationId` for
          registration detail.
        </p>
      </div>

      <div className="rounded-2xl border p-4">
        <p className="text-sm">
          Current team role: <span className="font-medium">{teamQuery.data?.membershipRole ?? "none"}</span>
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Non-owner team members stay read-only on registration detail.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/teams">Manage team</Link>
        </Button>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});
