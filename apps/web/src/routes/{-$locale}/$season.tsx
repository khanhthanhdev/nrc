import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, useParams, useRouterState } from "@tanstack/react-router";

import {
  PublicSeasonLoadErrorState,
  PublicSeasonNotFoundState,
  PublicSeasonPage,
  PublicSeasonPageSkeleton,
  SeasonInvalidParamState,
} from "@/features/seasons/public-season-page";
import { isSeasonNotFoundError } from "@/features/seasons/helpers";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { isValidSeason } from "@/lib/route-policy";
import { orpc } from "@/utils/orpc";

const SeasonPage = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { season } = useParams({ from: "/{-$locale}/$season" });

  const seasonQuery = useQuery({
    ...orpc.season.getPublicSeasonPage.queryOptions({ input: { year: season } }),
    enabled: isValidSeason(season),
    retry: false,
  });

  if (!isValidSeason(season)) {
    return <SeasonInvalidParamState />;
  }

  if (stripLocaleFromPathname(pathname) !== `/${season}`) {
    return <Outlet />;
  }

  if (seasonQuery.isLoading) {
    return <PublicSeasonPageSkeleton />;
  }

  if (seasonQuery.error) {
    return isSeasonNotFoundError(seasonQuery.error) ? (
      <PublicSeasonNotFoundState season={season} />
    ) : (
      <PublicSeasonLoadErrorState
        onRetry={async () => {
          await seasonQuery.refetch();
        }}
      />
    );
  }

  if (!seasonQuery.data) {
    return <PublicSeasonNotFoundState season={season} />;
  }

  return <PublicSeasonPage data={seasonQuery.data} />;
};

export const Route = createFileRoute("/{-$locale}/$season")({
  component: SeasonPage,
});
