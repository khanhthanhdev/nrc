import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

type PublicEventStatus =
  | "active"
  | "archived"
  | "completed"
  | "published"
  | "registration_closed"
  | "registration_open";

const STATUS_OPTIONS: PublicEventStatus[] = [
  "published",
  "registration_open",
  "registration_closed",
  "active",
  "completed",
  "archived",
];

const statusClassName = (status: string): string => {
  switch (status) {
    case "registration_open": {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    case "registration_closed": {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    case "active": {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }
    case "completed": {
      return "border-zinc-200 bg-zinc-50 text-zinc-600";
    }
    default: {
      return "border-zinc-200 bg-zinc-50 text-zinc-500";
    }
  }
};

export function PublicEventsListingPage() {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const eventsQuery = useQuery({
    ...orpc.registration.listPublicEvents.queryOptions({
      input: {
        limit: 20,
        page,
        ...(statusFilter !== "all" ? { status: statusFilter as PublicEventStatus } : {}),
      },
    }),
    retry: false,
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
          {t("publicEvents.title", "Events")}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          {t(
            "publicEvents.description",
            "Browse upcoming and past competition events. Register your team for events that are open for registration.",
          )}
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <NativeSelect
          className="w-full sm:w-56"
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          value={statusFilter}
        >
          <option value="all">{t("publicEvents.allStatuses", "All statuses")}</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </NativeSelect>
      </div>

      {eventsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="rounded-2xl border p-6" key={`event-skeleton-${index}`}>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-2 h-4 w-2/3" />
              <Skeleton className="mt-4 h-9 w-24" />
            </div>
          ))}
        </div>
      ) : eventsQuery.error ? (
        <Empty>
          <EmptyMedia>
            <Search />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("publicEvents.errorTitle", "Events unavailable")}</EmptyTitle>
            <EmptyDescription>{eventsQuery.error.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : !eventsQuery.data || eventsQuery.data.items.length === 0 ? (
        <Empty>
          <EmptyMedia>
            <CalendarDays />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("publicEvents.noEvents", "No events found")}</EmptyTitle>
            <EmptyDescription>
              {statusFilter !== "all"
                ? t("publicEvents.noEventsFilter", "No events match the selected filter.")
                : t("publicEvents.noEventsYet", "No events have been published yet.")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventsQuery.data.items.map((event) => (
              <div
                className="group rounded-2xl border bg-card p-6 transition-colors hover:border-primary/30"
                key={event.id}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{event.name}</h2>
                    <Badge
                      className={cn("shrink-0 border-transparent", statusClassName(event.status))}
                    >
                      {event.status.replaceAll("_", " ")}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>
                        {new Date(event.eventStartsAt).toLocaleDateString()} –{" "}
                        {new Date(event.eventEndsAt).toLocaleDateString()}
                      </span>
                    </div>
                    {event.location ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{event.venue ?? event.location}</span>
                      </div>
                    ) : null}
                  </div>

                  {event.summary ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{event.summary}</p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      params={{ eventId: event.eventCode, season: event.season }}
                      to={localizePathname("/$season/$eventId", activeLanguage)}
                    >
                      {t("publicEvents.view", "View")}
                    </Link>
                  </Button>
                  {event.status === "registration_open" ? (
                    <Button asChild size="sm">
                      <Link
                        params={{ eventId: event.id }}
                        to={localizePathname("/register/$eventId", activeLanguage)}
                      >
                        {t("publicEvents.register", "Register")}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              size="sm"
              variant="outline"
            >
              {t("publicEvents.previous", "Previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("publicEvents.page", "Page")} {page}
            </span>
            <Button
              disabled={!eventsQuery.data || eventsQuery.data.page >= eventsQuery.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              size="sm"
              variant="outline"
            >
              {t("publicEvents.next", "Next")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
