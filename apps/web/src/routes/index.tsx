import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bot, CheckCircle2, Radio, Rocket, Shield, Users } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { resolvePostAuthRoute } from "@/lib/auth-routing";
import { authClient } from "@/utils/auth-client";
import { orpc } from "@/utils/orpc";

const competitionMetrics = [
  {
    detail: "Across regional qualifiers and final rounds",
    label: "Registered teams",
    value: "128",
  },
  {
    detail: "Synchronized scoring and judging stations",
    label: "Fields online",
    value: "06",
  },
  {
    detail: "Currently updating scoreboards and status feeds",
    label: "Live matches",
    value: "14",
  },
] as const;

const activeTracks = [
  {
    slot: "Track A • 14:30",
    status: "LIVE",
    teams: "RoboPulse vs Delta Forge",
    title: "Autonomous Arena",
  },
  {
    slot: "Track B • 15:10",
    status: "UPCOMING",
    teams: "Circuit Breakers vs Nova Drive",
    title: "Rescue Systems",
  },
  {
    slot: "Track C • 16:00",
    status: "QUEUE",
    teams: "STEM Horizon vs Vortex Lab",
    title: "Innovation Sprint",
  },
] as const;

const operations = [
  {
    icon: Users,
    text: "Verify rosters, invite mentors, and move qualified teams into competition-ready states.",
    title: "Team onboarding",
  },
  {
    icon: Shield,
    text: "Protect accounts, permission scopes, and tournament workflows from a single hub.",
    title: "Access control",
  },
  {
    icon: Bot,
    text: "Monitor live rounds, field readiness, and status transitions with clear, high-contrast cards.",
    title: "Robot ops telemetry",
  },
] as const;

const HomeComponent = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());

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

  let healthState = {
    label: "API disconnected",
    tone: "bg-[#ee46bc]",
  };

  if (healthCheck.isLoading) {
    healthState = {
      label: "Checking systems",
      tone: "bg-[#447aff]",
    };
  } else if (healthCheck.data) {
    healthState = {
      label: "API connected",
      tone: "bg-[#22c55e]",
    };
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="nrc-card nrc-grid overflow-hidden px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)] lg:items-start">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="nrc-pill bg-[#172b4d] px-4 py-2 text-[0.75rem] font-bold tracking-[0.24em] text-white uppercase">
                Tournament Command
              </span>
              <span className="nrc-pill border border-[#d8e0ec] bg-white/85 px-4 py-2 text-sm font-medium text-[#6b778c] backdrop-blur">
                STEAM for Vietnam x OctoAI visual language
              </span>
            </div>

            <div className="max-w-4xl space-y-5">
              <h1 className="max-w-4xl text-5xl font-extrabold tracking-[-0.05em] text-[#172b4d] sm:text-6xl lg:text-[5.5rem] lg:leading-[0.95]">
                Run the <span className="nrc-gradient-text">National Robotics Competition</span>
                <br className="hidden lg:block" /> like a live engineering system.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#6b778c] sm:text-lg">
                A clean operations surface for registration, access, team progression, and live
                scoring. High-contrast cards, kinetic action cues, and clear tournament data keep
                coordinators focused under pressure.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link to="/teams/my">
                  Open team workspace
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/onboarding">Review onboarding</Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {competitionMetrics.map((metric) => (
                <article key={metric.label} className="nrc-card-subtle px-5 py-5">
                  <p className="text-sm font-medium text-[#6b778c]">{metric.label}</p>
                  <p className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-[#172b4d]">
                    {metric.value}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#6b778c]">{metric.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[30px] bg-[#172b4d] p-6 text-white shadow-[rgba(41,41,41,0.26)_0px_27px_27px_-20px]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.75rem] font-bold tracking-[0.22em] text-white/70 uppercase">
                    System health
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">Operations status</h2>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full bg-white/10">
                  <Rocket className="size-6" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-full bg-white/8 px-4 py-3">
                <span className={`size-3 rounded-full ${healthState.tone}`} />
                <span className="text-sm font-semibold tracking-[0.08em] uppercase">
                  {healthState.label}
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {activeTracks.map((track) => (
                  <article
                    key={track.title}
                    className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold">{track.title}</p>
                        <p className="mt-1 text-sm text-white/72">{track.slot}</p>
                      </div>
                      <span
                        className={`nrc-pill px-3 py-1 text-[0.7rem] font-bold tracking-[0.18em] uppercase ${track.status === "LIVE" ? "bg-[#ee46bc] text-white" : "bg-white/12 text-white"}`}
                      >
                        {track.status}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-medium text-white/88">{track.teams}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6 md:grid-cols-3">
          {operations.map(({ icon: Icon, text, title }) => (
            <article key={title} className="nrc-card px-6 py-6">
              <div className="flex size-14 items-center justify-center rounded-[24px] bg-[#eef3ff] text-[#447aff]">
                <Icon className="size-7" />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[#172b4d]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6b778c]">{text}</p>
            </article>
          ))}
        </div>

        <section className="nrc-card px-6 py-6 sm:px-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.75rem] font-bold tracking-[0.22em] text-[#6b778c] uppercase">
                Readiness
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#172b4d]">
                Control checklist
              </h2>
            </div>
            <div className="rounded-full bg-[#eef3ff] p-3 text-[#447aff]">
              <Radio className="size-5" />
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              "Verify judge access and role assignments",
              "Confirm team roster completion before match lock",
              "Monitor live API health during active rounds",
              "Keep bracket viewers and scoring panels in sync",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[24px] bg-[#f7f9fc] px-4 py-4"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#447aff]" />
                <p className="text-sm leading-6 text-[#172b4d]">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
