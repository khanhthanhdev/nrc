import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

import { AdminEventEditorPage } from "@/features/events/admin-event-pages";
import { useRequireAdmin } from "@/lib/route-guards";
import { authClient } from "@/utils/auth-client";
import { orpc } from "@/utils/orpc";

const StaffEventEditPage = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const { eventRecordId } = useParams({ from: "/staff/events/$eventRecordId/edit" });

  useRequireAdmin(session);

  const eventQuery = useQuery({
    ...orpc.event.getAdminEvent.queryOptions({
      input: { id: eventRecordId },
    }),
    enabled: Boolean(session.data && eventRecordId),
    retry: false,
  });

  if (session.isPending || eventQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading event editor...</p>
      </div>
    );
  }

  if (!session.data) {
    void navigate({ to: "/auth" });

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  if (eventQuery.error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Event unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{eventQuery.error.message}</p>
      </div>
    );
  }

  if (!eventQuery.data) {
    return null;
  }

  return <AdminEventEditorPage data={eventQuery.data} />;
};

export const Route = createFileRoute("/staff/events/$eventRecordId/edit")({
  component: StaffEventEditPage,
});
