import { useState } from "react";

import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicTeamList } from "@/lib/team-access";
import { TeamPublicCard } from "@/features/teams/team-public-card";

const TeamsPage = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const isListingPage = pathname === "/teams";
  const teamsQuery = usePublicTeamList(page, search, isListingPage);

  if (!isListingPage) {
    return <Outlet />;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Teams</h1>
          <p className="text-muted-foreground text-sm">Browse registered competition teams.</p>
        </div>

        {session.data && (
          <Button asChild>
            <Link to="/teams/new">Create team</Link>
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          className="max-w-sm"
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search teams..."
          value={search}
        />
      </div>

      {teamsQuery.isLoading && <p className="text-muted-foreground text-sm">Loading teams...</p>}

      {teamsQuery.error && <p className="text-destructive text-sm">{teamsQuery.error.message}</p>}

      {teamsQuery.data && teamsQuery.data.teams.length === 0 && (
        <div className="rounded-2xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? "No teams match your search." : "No teams registered yet."}
          </p>
        </div>
      )}

      {teamsQuery.data && teamsQuery.data.teams.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {teamsQuery.data.teams.map((t) => (
              <TeamPublicCard key={t.id} team={t} />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {teamsQuery.data.total} team{teamsQuery.data.total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={page * 20 >= teamsQuery.data.total}
                onClick={() => setPage((p) => p + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
});
