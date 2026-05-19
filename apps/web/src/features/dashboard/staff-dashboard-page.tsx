import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ClipboardList,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { isAdminSystemRole, type SystemRole } from "@/lib/route-policy";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

type StaffDashboardPageProps = {
  systemRole?: SystemRole;
};

const statusVariant = (status: string): "success" | "warning" | "info" | "error" | "secondary" => {
  if (status === "approved") return "success";
  if (status === "needs_revision" || status === "draft") return "warning";
  if (status === "submitted" || status === "under_review") return "info";
  if (status === "denied" || status === "withdrawn") return "error";
  return "secondary";
};

export function StaffDashboardPage({ systemRole }: StaffDashboardPageProps) {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const dashboardQuery = useQuery({
    ...orpc.dashboard.getStaffDashboard.queryOptions(),
    retry: false,
  });

  if (dashboardQuery.isLoading) {
    return <StaffDashboardSkeleton />;
  }

  const data = dashboardQuery.data;
  const quickActions = [
    [Trophy, t("staffDashboard.actions.events", "Events"), "/staff/events"],
    [ClipboardList, t("staffDashboard.actions.registrations", "Registrations"), "/staff/registrations"],
    [RefreshCw, t("staffDashboard.actions.sync", "Sync logs"), "/staff/sync"],
    ...(isAdminSystemRole(systemRole)
      ? ([[Users, t("staffDashboard.actions.users", "Users"), "/staff/users"]] as const)
      : []),
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            {t("staffDashboard.eyebrow", "Staff operations")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-foreground">
            {t("staffDashboard.title", "Operations dashboard")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t(
              "staffDashboard.description",
              "Track event workload, registration review, sync attention, and operational notices.",
            )}
          </p>
        </div>
        <Button asChild>
          <Link to={localizePathname("/staff/events", activeLanguage)}>
            <Trophy data-icon="inline-start" />
            {t("staffDashboard.manageEvents", "Manage events")}
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ShieldCheck} label={t("staffDashboard.kpis.seasons", "Active seasons")} value={data?.activeSeasonCount ?? 0} />
        <KpiCard icon={CalendarDays} label={t("staffDashboard.kpis.events", "Active events")} value={data?.activeEventCount ?? 0} />
        <KpiCard icon={ClipboardList} label={t("staffDashboard.kpis.pending", "Pending review")} tone="warning" value={data?.pendingRegistrationCount ?? 0} />
        <KpiCard icon={RefreshCw} label={t("staffDashboard.kpis.sync", "Sync attention")} tone="info" value={data?.syncAttentionCount ?? 0} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <main className="flex flex-col gap-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">{t("staffDashboard.registrations.title", "Recent registrations")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {(data?.recentRegistrations.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("staffDashboard.registrations.empty", "No registrations in scope yet.")}
                </p>
              ) : (
                data?.recentRegistrations.map((registration) => (
                  <Link
                    className="grid gap-3 rounded-md border p-3 hover:bg-muted md:grid-cols-[1fr_auto]"
                    key={registration.id}
                    params={{ registrationId: registration.id }}
                    to={localizePathname("/staff/registrations/$registrationId", activeLanguage)}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{registration.eventName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {registration.teamName} #{registration.teamNumber}
                      </p>
                    </div>
                    <Badge variant={statusVariant(registration.status)}>
                      {registration.status.replaceAll("_", " ")}
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">{t("staffDashboard.events.title", "Upcoming event operations")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {(data?.upcomingEvents.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("staffDashboard.events.empty", "No upcoming scoped events.")}
                </p>
              ) : (
                data?.upcomingEvents.map((event) => (
                  <div className="rounded-md border p-4" key={event.id}>
                    <p className="font-bold">{event.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(event.eventStartsAt).toLocaleDateString()}
                    </p>
                    <Badge className="mt-3" variant="secondary">{event.status.replaceAll("_", " ")}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </main>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-3 text-lg">
                <Zap className="text-primary" />
                {t("staffDashboard.actions.title", "Quick actions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              {quickActions.map(([Icon, label, href]) => (
                <Button asChild className="h-auto justify-start gap-3 py-3" key={href} variant="ghost">
                  <Link to={localizePathname(href, activeLanguage)}>
                    <Icon />
                    {label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">{t("staffDashboard.alerts.title", "Operational alerts")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {(data?.notifications.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("staffDashboard.alerts.empty", "No recent alerts.")}
                </p>
              ) : (
                data?.notifications.map((notification) => (
                  <div className="flex gap-3" key={notification.id}>
                    <span className="mt-1.5 size-2.5 rounded-full bg-primary" />
                    <div>
                      <p className="font-bold">{notification.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {data?.scopedEventCount !== null && data?.scopedEventCount !== undefined ? (
            <Card>
              <CardContent>
                <p className="text-sm font-bold">{t("staffDashboard.scope.title", "Manager scope")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("staffDashboard.scope.copy", "{{count}} active scoped events", {
                    count: data.scopedEventCount,
                  })}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  tone = "default",
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  tone?: "default" | "warning" | "info";
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-5">
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-md",
            tone === "warning"
              ? "bg-status-warning-soft text-status-warning-foreground"
              : tone === "info"
                ? "bg-status-info-soft text-status-info-foreground"
                : "bg-primary/10 text-primary",
          )}
        >
          <Icon />
        </span>
        <div>
          <p className="text-3xl font-bold leading-none">{value}</p>
          <p className="mt-2 font-bold leading-tight">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StaffDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
