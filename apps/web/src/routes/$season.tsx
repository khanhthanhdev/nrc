import { Link, Outlet, createFileRoute, useParams, useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { isValidSeason } from "@/lib/route-policy";

const SeasonPage = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { season } = useParams({ from: "/$season" });

  if (!isValidSeason(season)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Invalid season</h1>
        <p className="text-muted-foreground text-sm">Season must be a 4-digit year.</p>
      </div>
    );
  }

  if (pathname !== `/${season}`) {
    return <Outlet />;
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">Season</p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{season}</h1>
        <p className="text-muted-foreground text-sm">
          Old seasons stay in database. Public event info lives under `/:season/:eventId`.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold">Public event sample</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Open a season event page with FTC-style slugs.
          </p>
          <Button asChild className="mt-4">
            <Link params={{ eventId: "VNCMP", season }} to="/$season/$eventId">
              Open VNCMP
            </Link>
          </Button>
        </div>

        <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold">Team access</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Team create, view, manage lives under the teams namespace.
          </p>
          <Button asChild className="mt-4" variant="secondary">
            <Link to="/teams">Go to teams</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export const Route = createFileRoute("/$season")({
  component: SeasonPage,
});
