import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RouteSectionProps {
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: string;
}

export const RouteSection = ({ children, className, description, title }: RouteSectionProps) => (
  <section className={cn("nrc-card p-6 sm:p-8", className)}>
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{title}</h1>
      {description ? <p className="text-muted-foreground max-w-3xl text-sm leading-6">{description}</p> : null}
    </div>

    {children ? <div className="mt-6">{children}</div> : null}
  </section>
);
