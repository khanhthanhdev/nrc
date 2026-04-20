import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { useRequireStaff } from "@/lib/route-guards";

const StaffEventsPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();

  useRequireStaff(session);

  if (pathname !== "/staff/events") {
    return <Outlet />;
  }

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading events...</p>
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Staff events</h1>
        <p className="text-muted-foreground text-sm">Create and edit event records.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/staff/events/new">Create event</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link params={{ eventId: "VNCMP" }} to="/staff/events/$eventId/edit">
            Edit VNCMP
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/staff/events")({
  component: StaffEventsPage,
});
