import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import type { PublicEventDetailData } from "./types";

interface PublicEventShellProps {
  children: ReactNode;
  data: PublicEventDetailData;
  eventId: string;
  season: string;
}

const tabClassName = "nrc-hero-tab";

const activeTabClassName = "nrc-hero-tab-active";

export function PublicEventShell({ children, data, eventId, season }: PublicEventShellProps) {
  const tabs = [
    { label: "rankings", to: "/$season/$eventId/rankings" },
    { label: "qualifications", to: "/$season/$eventId/qualifications" },
    { label: "playoffs", to: "/$season/$eventId/playoffs" },
    { label: "awards", to: "/$season/$eventId/awards" },
  ] as const;

  return (
    <section className="space-y-6">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="nrc-hero overflow-hidden px-6 py-10 sm:px-8 sm:py-12 lg:px-12">
          <div className="max-w-3xl space-y-5">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.22em] text-white/65">Public event</p>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                {data.event.name}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/76">
                {data.event.summary ?? `${season} / ${eventId}`}
              </p>
            </div>

            <nav className="flex flex-wrap gap-3 border-t border-white/12 pt-5">
              {tabs.map(({ label, to }) => (
                <Link
                  key={to}
                  activeProps={{ className: activeTabClassName }}
                  className={tabClassName}
                  params={{ eventId, season }}
                  to={to}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
}
