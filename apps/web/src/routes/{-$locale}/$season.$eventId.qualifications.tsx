import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";

import { RouteSection } from "@/components/route-section";
import { PublicDataMessage, PublicMatchesTable } from "@/features/events/public-event-data";
import { PUBLIC_ROUTE_CACHE } from "@/lib/cache-config";
import { eventPageMeta } from "@/lib/og-tags";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";
import { orpc } from "@/utils/orpc";

const QualificationsPage = () => {
  const { eventId, season } = useParams({ from: "/{-$locale}/$season/$eventId/qualifications" });
  const isValidRoute = isValidSeason(season) && isValidEventId(eventId);
  const loaderData = Route.useLoaderData();
  const matchesQuery = useQuery({
    ...orpc.event.listPublicMatches.queryOptions({
      input: { eventCode: eventId, phase: "QUALIFICATION", season },
    }),
    enabled: isValidRoute,
    initialData: loaderData?.matches,
    refetchInterval: 30_000,
    retry: false,
  });

  if (!isValidRoute) {
    return null;
  }

  return (
    <RouteSection
      description="Qualification match schedule and posted scores from the synced event data."
      title="Qualifications"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          className="nrc-pill px-3 py-2 text-sm"
          params={{ eventId, season }}
          to="/{-$locale}/$season/$eventId/rankings"
        >
          rankings
        </Link>
      </div>
      {matchesQuery.isLoading ? (
        <PublicDataMessage title="Loading qualification matches..." />
      ) : null}
      {matchesQuery.error ? (
        <PublicDataMessage title="Qualification matches unavailable">
          Try refreshing after the event sync completes.
        </PublicDataMessage>
      ) : null}
      {!matchesQuery.isLoading && !matchesQuery.error ? (
        <PublicMatchesTable
          detailLinks
          emptyMessage="No qualification matches published yet."
          eventId={eventId}
          matches={matchesQuery.data ?? []}
          season={season}
        />
      ) : null}
    </RouteSection>
  );
};

export const Route = createFileRoute("/{-$locale}/$season/$eventId/qualifications")({
  component: QualificationsPage,
  gcTime: PUBLIC_ROUTE_CACHE.eventDetails.gcTime,
  loader: async ({ context, params }) => {
    if (!isValidSeason(params.season) || !isValidEventId(params.eventId)) {
      return undefined;
    }

    const eventInput = { eventCode: params.eventId, season: params.season };
    const matchInput = { ...eventInput, phase: "QUALIFICATION" as const };
    const [event, matches] = await Promise.all([
      context.queryClient.ensureQueryData(
        context.orpc.event.getPublicEvent.queryOptions({ input: eventInput }),
      ),
      context.queryClient.ensureQueryData(
        context.orpc.event.listPublicMatches.queryOptions({ input: matchInput }),
      ),
    ]);

    return { event, matches };
  },
  head: ({ loaderData }) => ({
    meta: eventPageMeta(loaderData?.event, "Qualifications"),
  }),
  staleTime: PUBLIC_ROUTE_CACHE.eventDetails.staleTime,
});
