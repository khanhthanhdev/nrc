import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useParams, useRouterState } from "@tanstack/react-router";

import { PublicEventShell } from "@/features/events/public-event-shell";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";
import { orpc } from "@/utils/orpc";

const EventPage = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { eventId, season } = useParams({ from: "/$season/$eventId" });
  const eventQuery = useQuery({
    ...orpc.event.getPublicEvent.queryOptions({
      input: { eventCode: eventId, season },
    }),
    enabled: isValidSeason(season) && isValidEventId(eventId),
    retry: false,
  });

  if (!isValidSeason(season) || !isValidEventId(eventId)) {
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

  return (
    <PublicEventShell data={eventQuery.data} eventId={eventId} season={season}>
      {pathname === `/${season}/${eventId}` ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="nrc-card-subtle p-4">
            <h2 className="text-lg font-semibold">Event info</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {eventQuery.data.event.description ?? "Event details will be updated by staff."}
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

export const Route = createFileRoute("/$season/$eventId")({
  component: EventPage,
});
