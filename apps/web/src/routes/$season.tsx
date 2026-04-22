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
    <section className="space-y-8">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="nrc-hero px-6 py-10 sm:px-8 sm:py-12 lg:px-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm uppercase tracking-[0.22em] text-white/65">Season</p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white">{season}</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/76">
              Old seasons stay in database. Public event info lives under `/:season/:eventId`.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="nrc-card-subtle p-4">
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

        <div className="nrc-card-subtle p-4">
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
