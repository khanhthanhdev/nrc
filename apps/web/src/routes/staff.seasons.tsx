import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { useRequireStaff } from "@/lib/route-guards";

const StaffSeasonsPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();

  useRequireStaff(session);

  if (pathname !== "/staff/seasons") {
    return <Outlet />;
  }

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading seasons...</p>
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
        <h1 className="text-2xl font-semibold">Staff seasons</h1>
        <p className="text-muted-foreground text-sm">Create and edit season records.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/staff/seasons/new">Create season</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link params={{ seasonId: "2025" }} to="/staff/seasons/$seasonId/edit">
            Edit 2025
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/staff/seasons")({
  component: StaffSeasonsPage,
});
