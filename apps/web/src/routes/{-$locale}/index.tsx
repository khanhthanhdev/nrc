import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { Button } from "@/components/ui/button";

const HomeComponent = () => {
  const { i18n } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <section className="space-y-16 sm:space-y-20">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <section className="nrc-hero relative overflow-hidden px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
            <div className="nrc-hero-orbit absolute right-[72px] top-16 size-80" />
            <div className="nrc-hero-panel absolute right-20 top-[104px] w-[344px]">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-white/74">National Robotics</span>
                <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white">
                  Live
                </span>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-4/5 rounded-full bg-white/80" />
                <div className="h-3 w-3/5 rounded-full bg-cyan-300/80" />
                <div className="h-3 w-2/3 rounded-full bg-blue-300/80" />
              </div>
              <div className="mt-7 grid grid-cols-3 gap-3">
                {["Teams", "Events", "Awards"].map((label) => (
                  <div className="rounded-lg border border-white/14 bg-white/8 p-3" key={label}>
                    <div className="mb-4 h-8 rounded bg-white/14" />
                    <p className="text-xs font-semibold text-white/76">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative max-w-3xl space-y-7">
            <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl">
              National Robotics Competition for Vietnam students.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
              A public competition hub inspired by STEAM for Vietnam: welcoming education content,
              strong blue actions, clear event pages, and calm tools for teams and organizers.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button asChild size="xl">
                <Link
                  params={{ eventId: "VNCMP", season: "2025" }}
                  to="/{-$locale}/$season/$eventId"
                >
                  View competition
                </Link>
              </Button>
              <Button
                asChild
                className="border-white !bg-transparent !text-white hover:!bg-white/10"
                size="xl"
                variant="outline"
              >
                <Link to="/{-$locale}/register">Register team</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-5">
          <h2 className="max-w-xl text-3xl font-bold tracking-[-0.01em] text-foreground sm:text-4xl">
            Built for learning, competition, and community.
          </h2>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
            The interface uses the STEAM for Vietnam foundation style: deep navy anchors, generous
            whitespace, rounded Quicksand typography, and practical blue interaction states.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Khóa học", "Clear public paths for students and mentors."],
            ["Đội thi", "Team profiles, invitations, and registration."],
            ["Sự kiện", "Rankings, playoffs, awards, and schedules."],
          ].map(([title, copy]) => (
            <div className="nrc-card p-6" key={title}>
              <h3 className="text-xl font-bold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="nrc-section-band -mx-4 px-4 py-12 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            [
              "01",
              "Public pages",
              "Season and event information stays readable for families, students, and volunteers.",
            ],
            [
              "02",
              "Team workflows",
              "Students can manage team identity, members, and registrations in one place.",
            ],
            [
              "03",
              "Staff operations",
              "Organizers keep dense admin tasks structured without losing the brand feel.",
            ],
          ].map(([number, title, copy]) => (
            <article className="nrc-card bg-white p-6" key={number}>
              <p className="text-sm font-bold text-primary">{number}</p>
              <h3 className="mt-4 text-2xl font-bold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export const Route = createFileRoute("/{-$locale}/")({
  component: HomeComponent,
});
