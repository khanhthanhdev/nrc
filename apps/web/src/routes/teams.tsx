import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { useCurrentTeamSummary } from "@/lib/team-access";
import { useRequireAuth } from "@/lib/route-guards";

const TeamsPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const teamQuery = useCurrentTeamSummary();

  useRequireAuth(session);

  if (pathname !== "/teams") {
    return <Outlet />;
  }

  if (session.isPending || teamQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading team...</p>
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

  if (teamQuery.error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-destructive text-sm">{teamQuery.error.message}</p>
      </div>
    );
  }

  if (!teamQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Teams</h1>
          <p className="text-muted-foreground text-sm">
            Create, view, and manage team data from this namespace.
          </p>
        </div>

        <div className="rounded-2xl border p-4">
          <p className="text-sm">You are not assigned to a team yet.</p>
          <Button asChild className="mt-4">
            <Link to="/teams/new">Create team</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Teams</h1>
          <p className="text-muted-foreground text-sm">
            Team management is sourced from Better Auth organization membership.
          </p>
        </div>

        <div className="rounded-2xl border p-4">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Team name</dt>
              <dd className="font-medium">{teamQuery.data.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Team number</dt>
              <dd className="font-medium">{teamQuery.data.teamNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Membership role</dt>
              <dd className="font-medium">{teamQuery.data.membershipRole}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">City / Province</dt>
              <dd className="font-medium">{teamQuery.data.cityOrProvince ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">School / Organization</dt>
              <dd className="font-medium">{teamQuery.data.schoolOrOrganization ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Description</dt>
              <dd className="font-medium">{teamQuery.data.description ?? "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/teams/new">Create team</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/register">Register event</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
});
