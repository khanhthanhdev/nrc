import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

import {
  AdminSeasonEditorPage,
  AdminSeasonEditorSkeleton,
  AdminSeasonInvalidState,
  AdminSeasonLoadErrorState,
  AdminSeasonNotFoundState,
} from "@/features/seasons/admin-season-pages";
import { isSeasonNotFoundError } from "@/features/seasons/helpers";
import { isValidSeason } from "@/lib/route-policy";
import { useRequireAdmin } from "@/lib/route-guards";
import { authClient } from "@/utils/auth-client";
import { orpc } from "@/utils/orpc";

const StaffSeasonEditPage = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const { seasonId } = useParams({ from: "/staff/seasons/$seasonId/edit" });

  useRequireAdmin(session);

  const seasonQuery = useQuery({
    ...orpc.season.getAdminSeason.queryOptions({ input: { year: seasonId } }),
    enabled: Boolean(session.data) && isValidSeason(seasonId),
    retry: false,
  });

  if (!isValidSeason(seasonId)) {
    return <AdminSeasonInvalidState />;
  }

  if (session.isPending) {
    return <AdminSeasonEditorSkeleton />;
  }

  if (!session.data) {
    void navigate({ to: "/auth" });

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  if (seasonQuery.isLoading) {
    return <AdminSeasonEditorSkeleton />;
  }

  if (seasonQuery.error) {
    return isSeasonNotFoundError(seasonQuery.error) ? (
      <AdminSeasonNotFoundState seasonYear={seasonId} />
    ) : (
      <AdminSeasonLoadErrorState
        onRetry={async () => {
          await seasonQuery.refetch();
        }}
      />
    );
  }

  if (!seasonQuery.data) {
    return <AdminSeasonNotFoundState seasonYear={seasonId} />;
  }

  return <AdminSeasonEditorPage data={seasonQuery.data} />;
};

export const Route = createFileRoute("/staff/seasons/$seasonId/edit")({
  component: StaffSeasonEditPage,
});
