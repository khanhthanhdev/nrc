import { Link } from "@tanstack/react-router";
import { Bell, CalendarDays, Check, ChevronRight, ClipboardList, HelpCircle, ListChecks, Users, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";

type RegistrationSummary = {
  createdAt: string;
  eventId: string;
  id: string;
  status: string;
  submittedAt: string | null;
};
const statusVariant = (status: string): "success" | "warning" | "info" | "error" | "secondary" => {
  if (status === "approved") {
    return "success";
  }
  if (status === "needs_revision" || status === "draft") {
    return "warning";
  }
  if (status === "submitted" || status === "under_review") {
    return "info";
  }
  if (status === "denied" || status === "withdrawn") {
    return "error";
  }
  return "secondary";
};

export function RegistrationStatus({ registrations }: { registrations: RegistrationSummary[] }) {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-3 text-lg">
          <ClipboardList className="text-primary" />
          {t("dashboard.registrations.title", "Registration Status")}
        </CardTitle>
        <CardAction>
          <Button asChild size="xs" variant="secondary">
            <Link to={localizePathname("/register", activeLanguage)}>
              {t("dashboard.viewAll", "View all")}
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {registrations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.registrations.empty", "No team registrations yet.")}
          </p>
        ) : (
          registrations.slice(0, 3).map((registration) => (
            <Link
              className="flex items-center gap-4 rounded-md p-2 hover:bg-muted"
              key={registration.id}
              params={{ eventId: registration.eventId, registrationId: registration.id }}
              to={localizePathname("/register/$eventId/$registrationId", activeLanguage)}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-status-success-soft text-status-success-foreground">
                <Check />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {t("dashboard.registrations.event", "Event registration")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(registration.submittedAt ?? registration.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={statusVariant(registration.status)}>
                {registration.status.replaceAll("_", " ")}
              </Badge>
              <ChevronRight className="text-muted-foreground" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function TasksPanel({ hasTeamDescription }: { hasTeamDescription: boolean }) {
  const { t } = useTranslation();
  const tasks = [
    [t("dashboard.tasks.profile", "Complete team profile"), t("dashboard.tasks.profileHint", "Add team description and logo"), hasTeamDescription ? "Low" : "High"],
    [t("dashboard.tasks.documents", "Submit required documents"), t("dashboard.tasks.documentsHint", "Upload team member list"), "Medium"],
    [t("dashboard.tasks.guidelines", "Review event guidelines"), t("dashboard.tasks.guidelinesHint", "Read competition rules"), "Low"],
  ];

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-3 text-lg">
          <ListChecks className="text-primary" />
          {t("dashboard.tasks.title", "Tasks")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        {tasks.map(([title, hint, priority]) => (
          <div className="flex items-center gap-4 py-3" key={title}>
            <span className="size-6 rounded-full border border-border" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{title}</p>
              <p className="truncate text-sm text-muted-foreground">{hint}</p>
            </div>
            <Badge variant={priority === "High" ? "info" : priority === "Medium" ? "warning" : "secondary"}>
              {priority}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function NotificationsPanel() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Bell className="text-primary" />
          {t("dashboard.notifications.title", "Notifications")}
        </CardTitle>
        <CardAction>
          <Button size="xs" variant="secondary">{t("dashboard.viewAll", "View all")}</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {[
          [t("dashboard.notifications.registration", "Registration confirmed"), t("dashboard.notifications.registrationCopy", "Your team registration has been confirmed."), "2 hours ago"],
          [t("dashboard.notifications.schedule", "Schedule updated"), t("dashboard.notifications.scheduleCopy", "Event schedule has been updated."), "1 day ago"],
        ].map(([title, copy, time]) => (
          <div className="flex gap-3" key={title}>
            <span className="mt-1.5 size-2.5 rounded-full bg-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
              <p className="mt-1 text-xs text-muted-foreground">{time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function QuickActions() {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const actions = [
    [CalendarDays, t("dashboard.actions.events", "Browse Events"), t("dashboard.actions.eventsHint", "Discover upcoming events"), "/events"],
    [Users, t("dashboard.actions.register", "Register Team"), t("dashboard.actions.registerHint", "Register for new events"), "/register"],
    [ClipboardList, t("dashboard.actions.registrations", "My Registrations"), t("dashboard.actions.registrationsHint", "View all team registrations"), "/register"],
    [Users, t("dashboard.actions.team", "Team Management"), t("dashboard.actions.teamHint", "Manage team members and info"), "/teams"],
  ] as const;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-3 text-lg"><Zap className="text-primary" />{t("dashboard.actions.title", "Quick Actions")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        {actions.map(([Icon, title, hint, href]) => (
          <Button asChild className="h-auto justify-start gap-3 py-3 text-left" key={href} variant="ghost">
            <Link to={localizePathname(href, activeLanguage)}>
              <Icon />
              <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="block text-sm font-normal text-muted-foreground">{hint}</span></span>
              <ChevronRight />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

export function HelpPanel() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="flex gap-4">
        <HelpCircle className="mt-1 text-primary" />
        <div>
          <p className="font-bold">{t("dashboard.help.title", "Need Help?")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.help.copy", "Check out our documentation or contact support.")}
          </p>
          <Button className="mt-4" size="sm" variant="secondary">{t("dashboard.help.action", "View Documentation")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
