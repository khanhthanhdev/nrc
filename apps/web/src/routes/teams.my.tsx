import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { orpc } from "@/utils/orpc";
import { Button } from "@/components/ui/button";

const MyTeamPage = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const teamQuery = useQuery({
    ...orpc.team.getMyTeam.queryOptions(),
    enabled: Boolean(session.data),
  });

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    if (!session.data) {
      void navigate({ to: "/auth" });
    }
  }, [navigate, session.data, session.isPending]);

  if (session.isPending || teamQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading team...</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  if (teamQuery.error) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-destructive text-sm">{teamQuery.error.message}</p>
      </div>
    );
  }

  if (!teamQuery.data) {
    return (
      <div className="container mx-auto max-w-2xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">My team</h1>
        <p className="text-muted-foreground text-sm">You are not assigned to any team yet.</p>
        <Button asChild>
          <Link to="/teams/new">Create team</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">My team</h1>
        <p className="text-muted-foreground text-sm">
          Team membership is sourced from Better Auth organization membership.
        </p>
      </div>

      <div className="rounded-lg border p-4">
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
    </div>
  );
};

export const Route = createFileRoute("/teams/my")({
  component: MyTeamPage,
});
