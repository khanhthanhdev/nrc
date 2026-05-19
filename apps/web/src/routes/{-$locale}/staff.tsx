import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { StaffSidebar } from "@/components/staff-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { StaffDashboardPage } from "@/features/dashboard/staff-dashboard-page";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { useRequireStaff } from "@/lib/route-guards";
import { getSystemRole } from "@/lib/route-policy";
import { useAuthSession } from "@/utils/auth-session-context";
const StaffOverviewPage = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = useAuthSession();
  const systemRole = getSystemRole(session.data);

  useRequireStaff(session);

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading staff dashboard...</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading staff dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-5rem)] w-full">
      <StaffSidebar />

      <SidebarInset className="flex-1 bg-muted/25">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          {stripLocaleFromPathname(pathname) === "/staff" ? (
            <StaffDashboardPage systemRole={systemRole} />
          ) : (
            <Outlet />
          )}
        </div>
      </SidebarInset>
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/staff")({
  component: StaffOverviewPage,
});
