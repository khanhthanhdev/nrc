import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { resolvePostAuthRoute } from "@/lib/auth-routing";
import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

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
    <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/55 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(122,90,248,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(68,122,255,0.14),transparent_28%)]" />
      <div className="nrc-grid absolute inset-0 opacity-70" />

      <div className="relative mx-auto flex min-h-[calc(100svh-15rem)] max-w-3xl flex-col justify-center gap-6">
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">NRC Web</p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em]">Competition hub</h1>
          <p className="max-w-2xl text-sm text-[#4f5d75]">
            Public event pages use `/:season/:eventId`. Team management stays under `/teams`. Staff CRUD
            stays under `/staff`.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link params={{ eventId: "VNCMP", season: "2025" }} to="/$season/$eventId">
              Open public event
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/teams">Manage team</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
