import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AdminSeasonCreatePage } from "@/features/seasons/admin-season-pages";
import { useRequireAdmin } from "@/lib/route-guards";
import { useAuthSession } from "@/utils/auth-session-context";
const StaffSeasonNewPage = () => {
  const navigate = useNavigate();
  const session = useAuthSession();

  useRequireAdmin(session);

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading season form...</p>
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

  return <AdminSeasonCreatePage />;
};

export const Route = createFileRoute("/{-$locale}/staff/seasons/new")({
  component: StaffSeasonNewPage,
});
