import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

interface PublicEventShellProps {
  children: ReactNode;
  eventId: string;
  season: string;
}

const tabClassName =
  "nrc-pill px-3 py-2 text-sm font-medium text-[#6b778c] transition-colors hover:bg-[#f7f9fc] hover:text-[#172b4d]";

const activeTabClassName = "bg-[#eef3ff] text-[#172b4d]";

export function PublicEventShell({ children, eventId, season }: PublicEventShellProps) {
  const tabs = [
    { label: "rankings", to: "/$season/$eventId/rankings" },
    { label: "qualifications", to: "/$season/$eventId/qualifications" },
    { label: "playoffs", to: "/$season/$eventId/playoffs" },
    { label: "awards", to: "/$season/$eventId/awards" },
  ] as const;

  return (
    <section className="space-y-6">
      <div className="rounded-4xl border border-white/70 bg-white/78 p-5 shadow-sm backdrop-blur">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">Public event</p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            {season} / {eventId}
          </h1>
          <p className="text-muted-foreground text-sm">
            FTC-like public information route. Read-only. Season-specific behavior comes from the
            shared adapter layer.
          </p>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
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

      <div className="space-y-4">{children}</div>
    </section>
  );
}
