import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";

import {
  AdminSeasonListPage,
  AdminSeasonListSkeleton,
} from "@/features/seasons/admin-season-pages";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { useRequireAdmin } from "@/lib/route-guards";
import { authClient } from "@/utils/auth-client";
import { orpc } from "@/utils/orpc";

const StaffSeasonsPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();

  useRequireAdmin(session);

  const seasonsQuery = useQuery({
    ...orpc.season.listAdminSeasons.queryOptions(),
    enabled: Boolean(session.data),
    retry: false,
  });

  if (stripLocaleFromPathname(pathname) !== "/staff/seasons") {
    return <Outlet />;
  }

  if (session.isPending) {
    return <AdminSeasonListSkeleton />;
  }

  if (!session.data) {
    void navigate({ to: "/{-$locale}/auth" });

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <AdminSeasonListPage
      error={seasonsQuery.error}
      isLoading={seasonsQuery.isLoading}
      onRetry={async () => {
        await seasonsQuery.refetch();
      }}
      seasons={seasonsQuery.data}
    />
  );
};

export const Route = createFileRoute("/{-$locale}/staff/seasons")({
  component: StaffSeasonsPage,
});
