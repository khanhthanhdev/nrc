import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

interface PlaceholderRoutePageAction {
  label: string;
  to: string;
}

export function PlaceholderRoutePage({
  actions = [],
  eyebrow,
  description,
  title,
}: {
  actions?: PlaceholderRoutePageAction[];
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.22em]">
          {eyebrow}
        </p>
        <div className="mt-4 max-w-2xl space-y-3">
          <h1 className="text-foreground text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm leading-7 sm:text-base">{description}</p>
        </div>

        {actions.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map((action, index) => (
              <Button asChild key={action.to} variant={index === 0 ? "default" : "secondary"}>
                <Link to={action.to}>{action.label}</Link>
              </Button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
