import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Plus,
  Trophy,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

import {
  DashboardSkeleton,
  TeamPanel,
  UpcomingSchedule,
} from "./team-dashboard-panels";
import {
  HelpPanel,
  NotificationsPanel,
  QuickActions,
  RegistrationStatus,
  TasksPanel,
} from "./team-dashboard-side-panels";

interface TeamDashboardPageProps {
  displayName: string;
}

export function TeamDashboardPage({ displayName }: TeamDashboardPageProps) {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const locale = activeLanguage === "vi" ? "vi-VN" : "en-US";

  const dashboardQuery = useQuery({
    ...orpc.dashboard.getUserDashboard.queryOptions(),
    retry: false,
  });

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  const data = dashboardQuery.data;
  const hasTeam = Boolean(data?.activeTeam);
  const upcomingEvents = data?.upcomingEvents ?? [];
  const registrations = data?.registrations ?? [];
  const pendingTasks = data?.tasks.length ?? 0;
  const notificationCount = data?.notifications.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">
            {t("dashboard.welcome", "Welcome back, {{name}}", { name: displayName })}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t(
              "dashboard.description",
              "Here's what's happening with your team and upcoming events.",
            )}
          </p>
        </div>
        <Button asChild>
          <Link to={localizePathname("/register", activeLanguage)}>
            <Plus data-icon="inline-start" />
            {t("dashboard.newRegistration", "New Registration")}
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label={t("dashboard.stats.upcoming", "Upcoming Events")}
          tone="info"
          value={upcomingEvents.length}
          detail={t("dashboard.stats.next30", "In the next 30 days")}
        />
        <StatCard
          icon={Trophy}
          label={t("dashboard.stats.activeTeam", "Active Team")}
          tone="success"
          value={hasTeam ? 1 : 0}
          detail={hasTeam ? t("dashboard.stats.registered", "Currently registered") : t("dashboard.stats.noTeam", "Create a team")}
        />
        <StatCard
          icon={ClipboardList}
          label={t("dashboard.stats.pendingTasks", "Pending Tasks")}
          tone="warning"
          value={pendingTasks}
          detail={t("dashboard.stats.actionRequired", "Action required")}
        />
        <StatCard
          icon={Bell}
          label={t("dashboard.stats.unread", "Unread Notifications")}
          tone="purple"
          value={notificationCount}
          detail={t("dashboard.stats.recentAlerts", "Recent updates")}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <main className="grid gap-6 lg:grid-cols-2">
          <UpcomingSchedule events={upcomingEvents} locale={locale} />
          <TeamPanel team={data?.activeTeam ?? null} />
          <RegistrationStatus registrations={registrations} />
          <TasksPanel tasks={data?.tasks ?? []} />
        </main>
        <aside className="flex flex-col gap-6">
          <NotificationsPanel notifications={data?.notifications ?? []} />
          <QuickActions />
          <HelpPanel />
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: typeof CalendarDays;
  label: string;
  tone: "info" | "success" | "warning" | "purple";
  value: number;
}) {
  const toneClass = {
    info: "bg-status-info-soft text-status-info-foreground",
    purple: "bg-purple-500/10 text-purple-700",
    success: "bg-status-success-soft text-status-success-foreground",
    warning: "bg-status-warning-soft text-status-warning-foreground",
  }[tone];

  return (
    <Card className="min-h-30">
      <CardContent className="flex items-center gap-5">
        <span className={cn("flex size-12 items-center justify-center rounded-md", toneClass)}>
          <Icon />
        </span>
        <div className="min-w-0">
          <p className="text-3xl font-bold leading-none">{value}</p>
          <p className="mt-2 font-bold leading-tight">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
