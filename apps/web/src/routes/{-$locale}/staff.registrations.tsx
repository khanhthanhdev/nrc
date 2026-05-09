import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";

import { StaffRegistrationsListPage } from "@/features/registration/staff-registrations-page";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { useRequireStaff } from "@/lib/route-guards";
import { authClient } from "@/utils/auth-client";

const StaffRegistrationsPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();

  useRequireStaff(session);

  if (stripLocaleFromPathname(pathname) !== "/staff/registrations") {
    return <Outlet />;
  }

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading registrations...</p>
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

  return <StaffRegistrationsListPage />;
};

export const Route = createFileRoute("/{-$locale}/staff/registrations")({
  component: StaffRegistrationsPage,
});
