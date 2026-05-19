import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { TeamDashboardPage } from "@/features/dashboard/team-dashboard-page";
import { getLocaleFromPathname, getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { publicPageMeta } from "@/lib/og-tags";
import { getSystemRole, isStaffSystemRole } from "@/lib/route-policy";
import { useRequireAuth } from "@/lib/route-guards";
import { useAuthSession } from "@/utils/auth-session-context";

const DashboardRoute = () => {
  const session = useAuthSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { t } = useTranslation();
  const currentLocale = getLocaleFromPathname(pathname) ?? getSupportedLocale(undefined);

  useRequireAuth(session);

  useEffect(() => {
    if (session.isPending || !session.data) {
      return;
    }

    if (isStaffSystemRole(getSystemRole(session.data))) {
      void navigate({ replace: true, to: localizePathname("/staff", currentLocale) });
    }
  }, [currentLocale, navigate, session.data, session.isPending]);

  if (session.isPending) {
    return <p className="text-muted-foreground text-sm">{t("dashboard.loading", "Loading dashboard...")}</p>;
  }

  if (!session.data) {
    return <p className="text-muted-foreground text-sm">{t("dashboard.redirecting", "Redirecting to sign in...")}</p>;
  }

  if (isStaffSystemRole(getSystemRole(session.data))) {
    return <p className="text-muted-foreground text-sm">{t("dashboard.redirecting", "Redirecting...")}</p>;
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
