import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AdminEventCreatePage } from "@/features/events/admin-event-pages";
import { useRequireAdmin } from "@/lib/route-guards";
import { authClient } from "@/utils/auth-client";

const StaffEventNewPage = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();

  useRequireAdmin(session);

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading event form...</p>
      </div>
    );
  }

  if (!session.data) {
    void navigate({ to: "/{-$locale}/auth" });

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  return <AdminEventCreatePage />;
};

export const Route = createFileRoute("/{-$locale}/staff/events/new")({
  component: StaffEventNewPage,
});
