import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";

import { RouteSection } from "@/components/route-section";
import { PublicDataMessage, PublicMatchesTable } from "@/features/events/public-event-data";
import { PUBLIC_ROUTE_CACHE } from "@/lib/cache-config";
import { eventPageMeta } from "@/lib/og-tags";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";
import { orpc } from "@/utils/orpc";

const PlayoffsPage = () => {
  const { eventId, season } = useParams({ from: "/{-$locale}/$season/$eventId/playoffs" });
  const isValidRoute = isValidSeason(season) && isValidEventId(eventId);
  const loaderData = Route.useLoaderData();
  const matchesQuery = useQuery({
    ...orpc.event.listPublicMatches.queryOptions({
      input: { eventCode: eventId, phase: "PLAYOFF", season },
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
      description="Playoff match schedule and posted scores from the synced event data."
      title="Playoffs"
    >
      {matchesQuery.isLoading ? <PublicDataMessage title="Loading playoff matches..." /> : null}
      {matchesQuery.error ? (
        <PublicDataMessage title="Playoff matches unavailable">
          Try refreshing after the event sync completes.
        </PublicDataMessage>
      ) : null}
      {!matchesQuery.isLoading && !matchesQuery.error ? (
        <PublicMatchesTable
          detailLinks
          detailRoute="playoffs"
          emptyMessage="No playoff matches published yet."
          eventId={eventId}
          matches={matchesQuery.data ?? []}
          season={season}
        />
      ) : null}
    </RouteSection>
  );
};

export const Route = createFileRoute("/{-$locale}/$season/$eventId/playoffs")({
  component: PlayoffsPage,
  gcTime: PUBLIC_ROUTE_CACHE.eventDetails.gcTime,
  loader: async ({ context, params }) => {
    if (!isValidSeason(params.season) || !isValidEventId(params.eventId)) {
      return undefined;
    }

    const eventInput = { eventCode: params.eventId, season: params.season };
    const matchInput = { ...eventInput, phase: "PLAYOFF" as const };
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
    meta: eventPageMeta(loaderData?.event, "Playoffs"),
  }),
  staleTime: PUBLIC_ROUTE_CACHE.eventDetails.staleTime,
});
