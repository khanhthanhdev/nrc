import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarDays, ClipboardCheck, MapPin, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

const statusClassName = (status: string): string => {
  switch (status) {
    case "approved": {
      return "nrc-badge-success";
    }
    case "denied": {
      return "border-destructive/20 bg-danger-soft text-destructive";
    }
    case "needs_revision": {
      return "nrc-badge-warning";
    }
    case "submitted":
    case "under_review": {
      return "nrc-badge-info";
    }
    case "withdrawn": {
      return "nrc-badge-neutral";
    }
    default: {
      return "nrc-badge-neutral";
    }
  }
};

export function RegisterLandingPage({
  teamId,
  teamName,
}: {
  teamId: string | null;
  teamName: string | null;
}) {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  const eventsQuery = useQuery({
    ...orpc.registration.listPublicEvents.queryOptions({
      input: { limit: 50, status: "registration_open" },
    }),
    retry: false,
  });

  const teamRegistrationsQuery = useQuery({
    ...orpc.registration.listTeamRegistrations.queryOptions({
      input: { teamId: teamId ?? "" },
    }),
    enabled: Boolean(teamId),
    retry: false,
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
          {t("registerLanding.title", "Register for an Event")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {teamName
            ? t("registerLanding.teamLabel", "Team: {{teamName}}", { teamName })
            : t("registerLanding.noTeam", "You must be part of a team to register.")}
        </p>
      </section>

      {!teamId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Users className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1 text-center">
              <p className="font-medium">{t("registerLanding.createTeamTitle", "No team found")}</p>
              <p className="text-sm text-muted-foreground">
                {t("registerLanding.createTeamDescription", "Create or join a team before registering for events.")}
              </p>
            </div>
            <Button asChild>
              <Link to={localizePathname("/teams", activeLanguage)}>
                {t("registerLanding.manageTeams", "Go to Teams")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {t("registerLanding.openEvents", "Open for Registration")}
              </CardTitle>
              <CardDescription>
                {t("registerLanding.openEventsDescription", "Events currently accepting team registrations.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {eventsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton className="h-16 w-full" key={`event-skel-${index}`} />
                  ))}
                </div>
              ) : !eventsQuery.data || eventsQuery.data.items.length === 0 ? (
                <Empty>
                  <EmptyMedia>
                    <CalendarDays />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>{t("registerLanding.noOpenEvents", "No open events")}</EmptyTitle>
                    <EmptyDescription>
                      {t("registerLanding.noOpenEventsDescription", "Check back later for events accepting registrations.")}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-3">
                  {eventsQuery.data.items.map((event) => (
                    <div
                      className="flex items-center justify-between gap-4 rounded-lg border p-4"
                      key={event.id}
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold">{event.name}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(event.eventStartsAt).toLocaleDateString()} –{" "}
                            {new Date(event.eventEndsAt).toLocaleDateString()}
                          </span>
                          {event.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.venue ?? event.location}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link
                          params={{ eventId: event.id }}
                          to={localizePathname("/register/$eventId", activeLanguage)}
                        >
                          {t("registerLanding.register", "Register")}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {teamRegistrationsQuery.data && teamRegistrationsQuery.data.length > 0 ? (
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  {t("registerLanding.myRegistrations", "My Registrations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {teamRegistrationsQuery.data.map((registration) => (
                    <div
                      className="flex items-center justify-between gap-4 rounded-lg border p-4"
                      key={registration.id}
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold">{registration.eventName ?? "Event"}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "border-transparent",
                              statusClassName(registration.status),
                            )}
                          >
                            {registration.status.replaceAll("_", " ")}
                          </Badge>
                          {registration.submittedAt ? (
                            <span className="text-xs text-muted-foreground">
                              {new Date(registration.submittedAt).toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          params={{
                            eventId: registration.eventId,
                            registrationId: registration.id,
                          }}
                          to={localizePathname(
                            "/register/$eventId/$registrationId",
                            activeLanguage,
                          )}
                        >
                          {registration.status === "draft"
                            ? t("registerLanding.continue", "Continue")
                            : t("registerLanding.viewRegistration", "View")}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
