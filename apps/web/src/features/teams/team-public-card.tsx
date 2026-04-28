import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";

import type { PublicTeamSummary } from "./types";

interface TeamPublicCardProps {
  team: PublicTeamSummary;
}

export function TeamPublicCard({ team }: TeamPublicCardProps) {
  const { i18n } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const initials = team.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      className="nrc-card-subtle flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
      params={{ teamNumber: team.teamNumber }}
      search={{ tab: undefined }}
      to={localizePathname("/teams/$teamNumber", activeLanguage)}
    >
      <Avatar className="size-12 shrink-0">
        <AvatarImage alt={team.name} src={team.avatarUrl ?? undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{team.name}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{team.teamNumber}</span>
        </div>
        {team.schoolOrOrganization && (
          <p className="truncate text-xs text-muted-foreground">{team.schoolOrOrganization}</p>
        )}
        {team.cityOrProvince && (
          <p className="truncate text-xs text-muted-foreground">{team.cityOrProvince}</p>
        )}
        {team.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{team.description}</p>
        )}
      </div>
    </Link>
  );
}
