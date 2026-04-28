import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderRoutePage } from "@/components/placeholder-route-page";

const StaffRegistrationsPage = () => (
  <PlaceholderRoutePage
    actions={[
      { label: "Return to staff overview", to: "/{-$locale}/staff" },
      { label: "Open teams", to: "/{-$locale}/teams" },
    ]}
    description="This route is live so the staff sidebar can support registration operations immediately. The detailed workflow can land here without another navigation change."
    eyebrow="Staff"
    title="Registration operations have a reserved home in the staff shell."
  />
);

export const Route = createFileRoute("/{-$locale}/staff/registrations")({
  component: StaffRegistrationsPage,
});
