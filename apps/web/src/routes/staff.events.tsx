import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";

import { AdminEventListPage, AdminEventListSkeleton } from "@/features/events/admin-event-pages";
import { useRequireAdmin } from "@/lib/route-guards";
import { authClient } from "@/utils/auth-client";
import { orpc } from "@/utils/orpc";

const StaffEventsPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();

  useRequireAdmin(session);

  const eventsQuery = useQuery({
    ...orpc.event.listAdminEvents.queryOptions(),
    enabled: Boolean(session.data),
    retry: false,
  });

  if (pathname !== "/staff/events") {
    return <Outlet />;
  }

  if (session.isPending) {
    return <AdminEventListSkeleton />;
  }

  if (!session.data) {
    void navigate({ to: "/auth" });

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <AdminEventListPage
      error={eventsQuery.error}
      events={eventsQuery.data}
      isLoading={eventsQuery.isLoading}
      onRetry={async () => {
        await eventsQuery.refetch();
      }}
    />
  );
};

export const Route = createFileRoute("/staff/events")({
  component: StaffEventsPage,
});
