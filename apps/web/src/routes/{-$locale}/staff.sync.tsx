import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderRoutePage } from "@/components/placeholder-route-page";

const StaffSyncPage = () => (
  <PlaceholderRoutePage
    actions={[
      { label: "Return to staff overview", to: "/{-$locale}/staff" },
      { label: "Open events", to: "/{-$locale}/staff/events" },
    ]}
    description="Use this placeholder to anchor future synchronization logs, import traces, or external system status without changing the sidebar structure again."
    eyebrow="Staff"
    title="Sync logs now have a stable destination in the staff panel."
  />
);

export const Route = createFileRoute("/{-$locale}/staff/sync")({
  component: StaffSyncPage,
});
