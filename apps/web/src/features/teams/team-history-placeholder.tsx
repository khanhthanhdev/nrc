import { useTranslation } from "react-i18next";

export function TeamHistoryPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="nrc-card-subtle space-y-2 p-4">
        <h2 className="text-sm font-semibold">{t("routes.team.history.eventsTitle")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("routes.team.history.eventsDescription")}
        </p>
      </div>

      <div className="nrc-card-subtle space-y-2 p-4">
        <h2 className="text-sm font-semibold">{t("routes.team.history.matchesTitle")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("routes.team.history.matchesDescription")}
        </p>
      </div>

      <div className="nrc-card-subtle space-y-2 p-4">
        <h2 className="text-sm font-semibold">{t("routes.team.history.awardsTitle")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("routes.team.history.awardsDescription")}
        </p>
      </div>
    </div>
  );
}
