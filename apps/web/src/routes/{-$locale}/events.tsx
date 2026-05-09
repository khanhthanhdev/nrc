import { createFileRoute } from "@tanstack/react-router";

import { PublicEventsListingPage } from "@/features/events/public-events-listing";

const EventsIndexPage = () => <PublicEventsListingPage />;

export const Route = createFileRoute("/{-$locale}/events")({
  component: EventsIndexPage,
});
