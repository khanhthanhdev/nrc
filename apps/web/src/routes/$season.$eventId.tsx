import { Link, Outlet, createFileRoute, useParams, useRouterState } from "@tanstack/react-router";

import { PublicEventShell } from "@/features/events/public-event-shell";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";

const EventPage = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { eventId, season } = useParams({ from: "/$season/$eventId" });

  if (!isValidSeason(season) || !isValidEventId(eventId)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Invalid public route</h1>
        <p className="text-muted-foreground text-sm">Season or event id failed validation.</p>
      </div>
    );
  }

  return (
    <PublicEventShell eventId={eventId} season={season}>
      {pathname === `/${season}/${eventId}` ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="nrc-card-subtle p-4">
            <h2 className="text-lg font-semibold">Event info</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Read-only public information page. Rankings, qualifications, playoffs, and awards
              live in the tabs above.
            </p>
          </div>

          <div className="nrc-card-subtle p-4">
            <h2 className="text-lg font-semibold">Quick links</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className="nrc-pill px-3 py-2 text-sm"
                params={{ eventId, season }}
                to="/$season/$eventId/rankings"
              >
                rankings
              </Link>
              <Link
                className="nrc-pill px-3 py-2 text-sm"
                params={{ eventId, season }}
                to="/$season/$eventId/qualifications"
              >
                qualifications
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </PublicEventShell>
  );
};

export const Route = createFileRoute("/$season/$eventId")({
  component: EventPage,
});
