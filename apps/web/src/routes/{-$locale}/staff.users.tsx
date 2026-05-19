import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useRequireAdmin } from "@/lib/route-guards";
import { useAuthSession } from "@/utils/auth-session-context";
import { UsersPage } from "./users";

const StaffUsersPage = () => {
  const navigate = useNavigate();
  const session = useAuthSession();

  useRequireAdmin(session);

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading user console...</p>
      </div>
    );
  }

  if (!session.data) {
    void navigate({ to: "/{-$locale}/auth" });
    return null;
  }

  return <UsersPage />;
};

export const Route = createFileRoute("/{-$locale}/staff/users")({
  component: StaffUsersPage,
});
