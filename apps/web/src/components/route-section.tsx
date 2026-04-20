import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RouteSectionProps {
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: string;
}

export const RouteSection = ({ children, className, description, title }: RouteSectionProps) => (
    <section
      className={cn(
        "rounded-[24px] border border-white/70 bg-white/78 p-5 shadow-sm backdrop-blur",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
