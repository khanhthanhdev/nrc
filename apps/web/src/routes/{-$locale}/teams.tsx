import { useState } from "react";

import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { usePublicTeamList } from "@/lib/team-access";
import { TeamPublicCard } from "@/features/teams/team-public-card";

const TeamsPage = () => {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const isListingPage = stripLocaleFromPathname(pathname) === "/teams";
  const teamsQuery = usePublicTeamList(page, search, isListingPage);

  if (!isListingPage) {
    return <Outlet />;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{t("routes.team.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("routes.team.titles.description")}</p>
        </div>

        {session.data && (
          <Button asChild>
            <Link to="/{-$locale}/teams/new">{t("routes.team.titles.create")}</Link>
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
          placeholder={t("routes.team.titles.searchPlaceholder")}
          value={search}
        />
      </div>

      {teamsQuery.isLoading && (
        <p className="text-muted-foreground text-sm">{t("routes.team.titles.loading")}</p>
      )}

      {teamsQuery.error && <p className="text-destructive text-sm">{teamsQuery.error.message}</p>}

      {teamsQuery.data && teamsQuery.data.teams.length === 0 && (
        <div className="rounded-2xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? t("routes.team.titles.emptySearch") : t("routes.team.titles.emptyState")}
          </p>
        </div>
      )}

      {teamsQuery.data && teamsQuery.data.teams.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {teamsQuery.data.teams.map((tItem) => (
              <TeamPublicCard key={tItem.id} team={tItem} />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {teamsQuery.data.total}{" "}
              {teamsQuery.data.total === 1
                ? t("routes.team.titles.teamCount")
                : t("routes.team.titles.teamCountPlural")}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                size="sm"
                variant="outline"
              >
                {t("routes.team.pagination.previous")}
              </Button>
              <Button
                disabled={page * 20 >= teamsQuery.data.total}
                onClick={() => setPage((p) => p + 1)}
                size="sm"
                variant="outline"
              >
                {t("routes.team.pagination.next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/teams")({
  component: TeamsPage,
});
