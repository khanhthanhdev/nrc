import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderRoutePage } from "@/components/placeholder-route-page";

const EventsIndexPage = () => (
  <PlaceholderRoutePage
    actions={[
      { label: "Open sample public event", to: "/{-$locale}/2025/VNCMP" },
      { label: "Go to team workspace", to: "/{-$locale}/teams" },
    ]}
    description="This public index route is now part of the main website navigation. It is live as a stable entry point while the richer public event directory is built out."
    eyebrow="Public events"
    title="A dedicated events landing page is now reserved in the website shell."
  />
);

export const Route = createFileRoute("/{-$locale}/events")({
  component: EventsIndexPage,
});
