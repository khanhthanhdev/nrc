import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";

import { StaffSidebar } from "@/components/staff-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRequireStaff } from "@/lib/route-guards";
import { getSystemRole, isAdminSystemRole } from "@/lib/route-policy";
import { authClient } from "@/utils/auth-client";

const StaffOverviewPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const systemRole = getSystemRole(session.data);
  const isAdmin = isAdminSystemRole(systemRole);

  useRequireStaff(session);

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
    <div className="flex min-h-[calc(100svh-5rem)] w-full">
      <StaffSidebar />

      <SidebarInset className="flex-1 bg-muted/25">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          {pathname === "/staff" ? (
            <>
              <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
                <div className="max-w-3xl space-y-3">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.22em]">
                    Staff panel
                  </p>
                  <h1 className="text-foreground text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                    Manage operations without leaving the main website shell.
                  </h1>
                  <p className="text-muted-foreground text-sm leading-7 sm:text-base">
                    Navigation stays persistent here so staff tasks can expand without crowding the
                    public header. Existing sections are live, and upcoming surfaces are already
                    reachable as placeholders.
                  </p>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {isAdmin ? (
                  <div className="nrc-card space-y-4 p-6">
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                        Admin only
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                        Seasons
                      </h2>
                      <p className="text-muted-foreground mt-2 text-sm leading-6">
                        Create and revise yearly shells for public and staff event operations.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link to="/staff/seasons">Open</Link>
                      </Button>
                      <Button asChild size="sm" variant="secondary">
                        <Link to="/staff/seasons/new">New</Link>
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="nrc-card space-y-4 p-6">
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                      Active today
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      Events
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      Keep public event pages and staff editing flows aligned from one section.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link to="/staff/events">Open</Link>
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/staff/events/new">New</Link>
                    </Button>
                  </div>
                </div>

                <div className="nrc-card space-y-4 p-6">
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                      Ready for expansion
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      Registrations
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      Placeholder route is live so the staff IA can grow without another nav pass.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/staff/registrations">Open</Link>
                  </Button>
                </div>

                <div className="nrc-card space-y-4 p-6">
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                      Ready for expansion
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      Sync logs
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      Audit sync and ingestion events from one dedicated operational surface.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/staff/sync">Open</Link>
                  </Button>
                </div>

                {isAdmin && (
                  <>
                    <div className="nrc-card space-y-4 p-6">
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                          Admin only
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                          Users
                        </h2>
                        <p className="text-muted-foreground mt-2 text-sm leading-6">
                          The existing admin console now lives inside the staff shell.
                        </p>
                      </div>
                      <Button asChild size="sm">
                        <Link to="/staff/users">Open</Link>
                      </Button>
                    </div>

                    <div className="nrc-card space-y-4 p-6">
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                          Admin only
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                          Settings
                        </h2>
                        <p className="text-muted-foreground mt-2 text-sm leading-6">
                          Placeholder route for platform-level staff settings and operational guardrails.
                        </p>
                      </div>
                      <Button asChild size="sm" variant="secondary">
                        <Link to="/staff/settings">Open</Link>
                      </Button>
                    </div>
                  </>
                )}
              </section>
            </>
          ) : (
            <Outlet />
          )}
        </div>
      </SidebarInset>
    </div>
  );
};

export const Route = createFileRoute("/staff")({
  component: StaffOverviewPage,
});
