import { cn } from "@/lib/utils";

interface StatusStep {
  key: string;
  label: string;
}

const PIPELINE_STEPS: StatusStep[] = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "approved", label: "Approved" },
];

const TERMINAL_STATUSES: Record<string, string> = {
  denied: "Denied",
  needs_revision: "Needs Revision",
  withdrawn: "Withdrawn",
};

const getStepIndex = (status: string): number => {
  const index = PIPELINE_STEPS.findIndex((step) => step.key === status);

  return index >= 0 ? index : -1;
};

export function RegistrationStatusPipeline({ status }: { status: string }) {
  const currentIndex = getStepIndex(status);
  const isTerminal = status in TERMINAL_STATUSES;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {PIPELINE_STEPS.map((step, index) => {
          const isActive = step.key === status;
          const isCompleted = currentIndex >= 0 && index < currentIndex;
          const isFaded = isTerminal && !isActive;

          return (
            <div className="flex flex-1 items-center" key={step.key}>
              <div className="flex w-full flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCompleted
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : isFaded
                          ? "border-muted bg-muted text-muted-foreground"
                          : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span
                  className={cn(
                    "text-center text-[0.65rem] font-medium leading-tight",
                    isActive
                      ? "text-primary"
                      : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < PIPELINE_STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mb-5 h-0.5 w-full min-w-4",
                    isCompleted ? "bg-primary/30" : "bg-border",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {isTerminal ? (
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-center text-sm font-medium",
            status === "denied"
              ? "bg-red-50 text-red-700"
              : status === "withdrawn"
                ? "bg-zinc-100 text-zinc-600"
                : "bg-amber-50 text-amber-700",
          )}
        >
          {TERMINAL_STATUSES[status]}
        </div>
      ) : null}
    </div>
  );
}
