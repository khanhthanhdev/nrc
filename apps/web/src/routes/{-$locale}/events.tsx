import { createFileRoute } from "@tanstack/react-router";

import { PublicEventsListingPage } from "@/features/events/public-events-listing";
import { PUBLIC_ROUTE_CACHE } from "@/lib/cache-config";
import { publicPageMeta } from "@/lib/og-tags";

const EventsIndexPage = () => {
  const initialEvents = Route.useLoaderData();
  return <PublicEventsListingPage initialEvents={initialEvents} />;
};

export const Route = createFileRoute("/{-$locale}/events")({
  component: EventsIndexPage,
  gcTime: PUBLIC_ROUTE_CACHE.eventsListing.gcTime,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      context.orpc.registration.listPublicEvents.queryOptions({
        input: {
          limit: 20,
          page: 1,
        },
      }),
    ),
  head: () => ({
    meta: publicPageMeta(
      "Events | NRC",
      "Browse upcoming and past National Robotics Competition events.",
    ),
  }),
  staleTime: PUBLIC_ROUTE_CACHE.eventsListing.staleTime,
});
