import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TeamDashboardPage } from "@/features/dashboard/team-dashboard-page";
import { publicPageMeta } from "@/lib/og-tags";
import { useRequireAuth } from "@/lib/route-guards";
import { useAuthSession } from "@/utils/auth-session-context";

const DashboardRoute = () => {
  const session = useAuthSession();
  const { t } = useTranslation();

  useRequireAuth(session);

  if (session.isPending) {
    return <p className="text-muted-foreground text-sm">{t("dashboard.loading", "Loading dashboard...")}</p>;
  }

  if (!session.data) {
    return <p className="text-muted-foreground text-sm">{t("dashboard.redirecting", "Redirecting to sign in...")}</p>;
  }

  return <TeamDashboardPage displayName={session.data.user.name || session.data.user.email} />;
};

export const Route = createFileRoute("/{-$locale}/dashboard")({
  component: DashboardRoute,
  head: () => ({
    meta: publicPageMeta(
      "Dashboard | NRC",
      "Team dashboard for schedules, registration status, notifications, and quick actions.",
    ),
  }),
});

