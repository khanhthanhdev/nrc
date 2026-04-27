import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { resolvePostAuthRoute } from "@/lib/auth-routing";
import { Button } from "@/components/ui/button";
import { authClient } from "@/utils/auth-client";

const HomeComponent = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    void (async () => {
      if (!session.data) {
        await navigate({ to: "/auth" });
        return;
      }

      const to = await resolvePostAuthRoute();

      if (to !== "/") {
        await navigate({ to });
      }
    })();
  }, [navigate, session.data, session.isPending]);

  return (
    <section className="space-y-8">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <section className="nrc-hero overflow-hidden px-6 py-14 sm:px-10 sm:py-18 lg:px-14 lg:py-24">
          <div className="max-w-3xl space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/70">NRC Web</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Competition operations built with a public-facing calm.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
              Inspired by the STEAM for Vietnam visual language: strong hero contrast, clean white
              content surfaces, and clear blue calls to action. Public event pages live under
              `/:season/:eventId`, while teams and staff workflows stay structured and quiet.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link params={{ eventId: "VNCMP", season: "2025" }} to="/$season/$eventId">
                  Open public event
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/teams">Manage team</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div className="nrc-card p-6 sm:p-7">
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">Public routes</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Season and event pages present the competition clearly.
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Rankings, qualifications, playoffs, and awards are organized under a single public event
            shell so information stays easy to scan.
          </p>
        </div>

        <div className="nrc-card-subtle p-6">
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">Teams</p>
          <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Structured team ops
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Team creation, registration, and account settings remain inside light, readable
            surfaces.
          </p>
        </div>

        <div className="nrc-card-subtle p-6">
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">Admin</p>
          <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Quiet operational UI
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Admin pages keep the same palette, but avoid marketing effects so operational density
            stays usable.
          </p>
        </div>
      </div>
    </section>
  );
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
