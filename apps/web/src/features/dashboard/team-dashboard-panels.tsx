import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";

type PublicEvent = {
  eventStartsAt: string;
  id: string;
  location: string | null;
  name: string;
  status: string;
  venue: string | null;
};

type TeamSummary = {
  description: string | null;
  id: string;
  membershipRole: string;
  name: string;
  schoolOrOrganization: string | null;
  teamNumber: string;
};

const formatDate = (value: string, locale: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));

export function UpcomingSchedule({ events, locale }: { events: PublicEvent[]; locale: string }) {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-3 text-lg">
          <CalendarDays className="text-primary" />
          {t("dashboard.schedule.title", "Upcoming Schedule")}
        </CardTitle>
        <CardAction>
          <Button asChild size="xs" variant="secondary">
            <Link to={localizePathname("/events", activeLanguage)}>
              {t("dashboard.viewEvents", "View all events")}
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.schedule.empty", "No upcoming events are published yet.")}
          </p>
        ) : (
          events.map((event) => (
            <div className="flex items-center gap-4" key={event.id}>
              <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-md border bg-muted text-center">
                <span className="text-xs font-bold uppercase">
                  {formatDate(event.eventStartsAt, locale, { day: undefined, month: "short" })}
                </span>
                <span className="text-2xl font-bold leading-none">
                  {formatDate(event.eventStartsAt, locale, { day: "2-digit", month: undefined, year: undefined })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(event.eventStartsAt, locale, { day: undefined, month: undefined, year: "numeric" })}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{event.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {event.venue ?? event.location ?? t("dashboard.locationSoon", "Location coming soon")}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDate(event.eventStartsAt, locale)}
                </p>
              </div>
              <Badge variant="info">{event.status.replaceAll("_", " ")}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function TeamPanel({ team }: { team: TeamSummary | null }) {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Users className="text-primary" />
          {t("dashboard.team.title", "My Teams")}
        </CardTitle>
        <CardAction>
          <Button asChild size="xs" variant="secondary">
            <Link to={localizePathname("/teams", activeLanguage)}>
              {t("dashboard.team.viewAll", "View all teams")}
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {team ? (
          <div className="rounded-md border p-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-13">
                <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{team.name}</p>
                <p className="text-sm text-muted-foreground">
                  #{team.teamNumber} · {team.schoolOrOrganization ?? team.membershipRole}
                </p>
              </div>
              <Badge variant="success">{t("dashboard.team.active", "Active")}</Badge>
            </div>
            <Button asChild className="mt-5 w-full" size="sm" variant="secondary">
              <Link
                params={{ teamNumber: team.teamNumber }}
                to={localizePathname("/teams/$teamNumber", activeLanguage)}
              >
                {t("dashboard.team.manage", "Manage Team")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="font-bold">{t("dashboard.team.emptyTitle", "No team yet")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.team.emptyDescription", "Create or join a team to unlock team actions.")}
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to={localizePathname("/teams/new", activeLanguage)}>
                {t("dashboard.team.create", "Create team")}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
