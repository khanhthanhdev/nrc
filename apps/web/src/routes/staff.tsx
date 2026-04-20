import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { useRequireStaff } from "@/lib/route-guards";

const StaffPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();

  useRequireStaff(session);

  if (pathname !== "/staff") {
    return <Outlet />;
  }

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading staff dashboard...</p>
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
        <h1 className="text-2xl font-semibold">Staff</h1>
        <p className="text-muted-foreground text-sm">
          Staff-only CRUD and operational pages live here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <h2 className="font-semibold">Seasons</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/staff/seasons">Open</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/staff/seasons/new">New</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <h2 className="font-semibold">Events</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/staff/events">Open</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/staff/events/new">New</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/staff")({
  component: StaffPage,
});
