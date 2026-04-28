import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useParams, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  AllianceTeams,
  PublicDataMessage,
  PublicMatchesTable,
  formatPublicEventDateTime,
  formatPublicScore,
  getRankingQualifyingScore,
} from "@/features/events/public-event-data";
import { PublicEventShell } from "@/features/events/public-event-shell";
import { getSupportedLocale, stripLocaleFromPathname } from "@/lib/locale-routing";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";
import { orpc } from "@/utils/orpc";

const EventPage = () => {
  const { i18n } = useTranslation();
  const locale = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { eventId, season } = useParams({ from: "/{-$locale}/$season/$eventId" });
  const isValidRoute = isValidSeason(season) && isValidEventId(eventId);
  const eventQuery = useQuery({
    ...orpc.event.getPublicEvent.queryOptions({
      input: { eventCode: eventId, season },
    }),
    enabled: isValidRoute,
    retry: false,
  });
  const matchesQuery = useQuery({
    ...orpc.event.listPublicMatches.queryOptions({
      input: { eventCode: eventId, season },
    }),
    enabled: isValidRoute,
    refetchInterval: 30_000,
    retry: false,
  });
  const rankingsQuery = useQuery({
    ...orpc.event.listPublicRankings.queryOptions({
      input: { eventCode: eventId, season },
    }),
    enabled: isValidRoute,
    refetchInterval: 30_000,
    retry: false,
  });

  if (!isValidRoute) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Invalid public route</h1>
        <p className="text-muted-foreground text-sm">Season or event id failed validation.</p>
      </div>
    );
  }

  if (eventQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading event...</p>
      </div>
    );
  }

  if (eventQuery.error || !eventQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Event not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This event is unavailable or has not been published.
        </p>
      </div>
    );
  }

  const matches = matchesQuery.data ?? [];
  const qualificationCount = matches.filter((match) => match.phase === "QUALIFICATION").length;
  const playoffCount = matches.filter((match) => match.phase === "PLAYOFF").length;
  const postedCount = matches.filter(
    (match) => match.redScore !== null || match.blueScore !== null,
  ).length;
  const qualificationMatches = matches.filter((match) => match.phase === "QUALIFICATION");
  const playoffMatches = matches.filter((match) => match.phase === "PLAYOFF");
  const latestResults = matches
    .filter((match) => match.redScore !== null || match.blueScore !== null)
    .toSorted((left, right) => {
      const leftTime = new Date(left.playedAt ?? left.scheduledStartAt ?? 0).getTime();
      const rightTime = new Date(right.playedAt ?? right.scheduledStartAt ?? 0).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 6);
  const upcomingMatches = matches
    .filter(
      (match) => match.scheduledStartAt && match.redScore === null && match.blueScore === null,
    )
    .toSorted(
      (left, right) =>
        new Date(left.scheduledStartAt ?? 0).getTime() -
        new Date(right.scheduledStartAt ?? 0).getTime(),
    )
    .slice(0, 5);

  return (
    <PublicEventShell data={eventQuery.data} eventId={eventId} season={season}>
      {stripLocaleFromPathname(pathname) === `/${season}/${eventId}` ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="nrc-card-subtle p-4">
            <h2 className="text-lg font-semibold">Event info</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {eventQuery.data.event.description ?? "Event details will be updated by staff."}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border bg-background/60 p-3">
                <p className="text-muted-foreground text-xs">Qualifications</p>
                <p className="text-xl font-semibold">{qualificationCount}</p>
              </div>
              <div className="rounded-2xl border bg-background/60 p-3">
                <p className="text-muted-foreground text-xs">Playoffs</p>
                <p className="text-xl font-semibold">{playoffCount}</p>
              </div>
              <div className="rounded-2xl border bg-background/60 p-3">
                <p className="text-muted-foreground text-xs">Posted</p>
                <p className="text-xl font-semibold">{postedCount}</p>
              </div>
            </div>
          </div>

          <div className="nrc-card-subtle p-4">
            <h2 className="text-lg font-semibold">Quick links</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className="nrc-pill px-3 py-2 text-sm"
                params={{ eventId, season }}
                to="/{-$locale}/$season/$eventId/rankings"
              >
                rankings
              </Link>
              <Link
                className="nrc-pill px-3 py-2 text-sm"
                params={{ eventId, season }}
                to="/{-$locale}/$season/$eventId/qualifications"
              >
                qualifications
              </Link>
              <Link
                className="nrc-pill px-3 py-2 text-sm"
                params={{ eventId, season }}
                to="/{-$locale}/$season/$eventId/playoffs"
              >
                playoffs
              </Link>
              <Link
                className="nrc-pill px-3 py-2 text-sm"
                params={{ eventId, season }}
                to="/{-$locale}/$season/$eventId/awards"
              >
                awards
              </Link>
            </div>
          </div>
          <div className="nrc-card-subtle p-4 md:col-span-2">
            <h2 className="text-lg font-semibold">Schedule</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Upcoming matches from the published event schedule.
            </p>
            <div className="mt-4 space-y-3">
              {matchesQuery.isLoading ? <PublicDataMessage title="Loading schedule..." /> : null}
              {matchesQuery.error ? (
                <PublicDataMessage title="Schedule unavailable">
                  Try refreshing after the event sync completes.
                </PublicDataMessage>
              ) : null}
              {!matchesQuery.isLoading && !matchesQuery.error && upcomingMatches.length === 0 ? (
                <PublicDataMessage title="No upcoming matches published." />
              ) : null}
              {upcomingMatches.map((match) => {
                const matchNumber =
                  match.sequenceNumber > 0
                    ? match.sequenceNumber.toString()
                    : match.matchKey.replace(/^[A-Z]+/i, "") || match.matchKey;
                const matchLabel = ["QUALIFICATION", "PLAYOFF"].includes(match.phase) ? (
                  <Link
                    className="font-semibold underline-offset-4 hover:underline"
                    params={{ eventId, matchNumber, season }}
                    to={
                      match.phase === "PLAYOFF"
                        ? "/{-$locale}/$season/$eventId/playoffs/$matchNumber"
                        : "/{-$locale}/$season/$eventId/qualifications/$matchNumber"
                    }
                  >
                    {match.matchKey}
                  </Link>
                ) : (
                  <span className="font-semibold">{match.matchKey}</span>
                );

                return (
                  <div className="rounded-2xl border bg-background/60 p-3" key={match.matchKey}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        {matchLabel}
                        <p className="text-muted-foreground text-xs">
                          {formatPublicEventDateTime(match.scheduledStartAt, locale)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-medium">{formatPublicScore(match.redScore)}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-medium">{formatPublicScore(match.blueScore)}</span>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 lg:grid-cols-2">
                      <AllianceTeams color="red" teams={match.redAlliance} />
                      <AllianceTeams color="blue" teams={match.blueAlliance} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="nrc-card-subtle p-4 md:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Match results</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Published qualification and playoff results with links to score breakdowns.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="nrc-pill px-3 py-2 text-sm"
                  params={{ eventId, season }}
                  to="/{-$locale}/$season/$eventId/qualifications"
                >
                  all qualifications
                </Link>
                <Link
                  className="nrc-pill px-3 py-2 text-sm"
                  params={{ eventId, season }}
                  to="/{-$locale}/$season/$eventId/playoffs"
                >
                  all playoffs
                </Link>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {matchesQuery.isLoading ? <PublicDataMessage title="Loading results..." /> : null}
              {matchesQuery.error ? (
                <PublicDataMessage title="Results unavailable">
                  Try refreshing after the event sync completes.
                </PublicDataMessage>
              ) : null}
              {!matchesQuery.isLoading && !matchesQuery.error && latestResults.length === 0 ? (
                <PublicDataMessage title="No results posted yet." />
              ) : null}
              {latestResults.length > 0 ? (
                <PublicMatchesTable
                  detailLinks
                  detailRoute="auto"
                  emptyMessage="No results posted yet."
                  eventId={eventId}
                  matches={latestResults}
                  season={season}
                />
              ) : null}
            </div>
          </div>
          <div className="nrc-card-subtle p-4 md:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Rankings</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Current qualification ranking snapshot from published event data.
                </p>
              </div>
              <Link
                className="nrc-pill px-3 py-2 text-sm"
                params={{ eventId, season }}
                to="/{-$locale}/$season/$eventId/rankings"
              >
                full rankings
              </Link>
            </div>
            <div className="mt-4">
              {rankingsQuery.isLoading ? <PublicDataMessage title="Loading rankings..." /> : null}
              {rankingsQuery.error ? (
                <PublicDataMessage title="Rankings unavailable">
                  Try refreshing after the event sync completes.
                </PublicDataMessage>
              ) : null}
              {!rankingsQuery.isLoading &&
              !rankingsQuery.error &&
              (rankingsQuery.data ?? []).length === 0 ? (
                <PublicDataMessage title="No rankings published yet." />
              ) : null}
              {(rankingsQuery.data ?? []).length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {(rankingsQuery.data ?? []).slice(0, 8).map((ranking) => (
                    <div
                      className="rounded-2xl border bg-background/60 p-3"
                      key={ranking.teamNumber}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-muted-foreground text-xs">Rank {ranking.rank}</p>
                          <p className="text-lg font-semibold">Team {ranking.teamNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {ranking.wins}-{ranking.losses}-{ranking.ties}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {ranking.matchesPlayed} played
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-3 text-xs">
                        QS:{" "}
                        <span className="font-semibold text-foreground">
                          {getRankingQualifyingScore(ranking)}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="nrc-card-subtle p-4 md:col-span-2">
            <h2 className="text-lg font-semibold">All public matches</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Qualification and playoff schedule, results, and score status.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="mb-2 font-medium">Qualifications</h3>
                <PublicMatchesTable
                  detailLinks
                  emptyMessage="No qualification matches published yet."
                  eventId={eventId}
                  matches={qualificationMatches}
                  season={season}
                />
              </div>
              <div>
                <h3 className="mb-2 font-medium">Playoffs</h3>
                <PublicMatchesTable
                  detailLinks
                  detailRoute="playoffs"
                  emptyMessage="No playoff matches published yet."
                  eventId={eventId}
                  matches={playoffMatches}
                  season={season}
                />
              </div>
            </div>
          </div>
          {eventQuery.data.documents.length > 0 ? (
            <div className="nrc-card-subtle p-4 md:col-span-2">
              <h2 className="text-lg font-semibold">Documents</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {eventQuery.data.documents.map((document) => (
                  <a
                    className="nrc-pill px-3 py-2 text-sm"
                    href={document.url}
                    key={document.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {document.title}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <Outlet />
      )}
    </PublicEventShell>
  );
};

export const Route = createFileRoute("/{-$locale}/$season/$eventId")({
  component: EventPage,
});
