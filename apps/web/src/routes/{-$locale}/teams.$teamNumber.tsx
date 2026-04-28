import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TeamHistoryPlaceholder } from "@/features/teams/team-history-placeholder";
import { TeamInvitationsPanel } from "@/features/teams/team-invitations-panel";
import { TeamMembersList } from "@/features/teams/team-members-list";
import { TeamProfileForm } from "@/features/teams/team-profile-form";
import { TeamProfileShell } from "@/features/teams/team-profile-shell";
import type { TeamProfileTab } from "@/features/teams/team-profile-shell";
import { usePublicTeamProfile } from "@/lib/team-access";
import { canInviteToTeam, canManageTeam } from "@/lib/route-policy";
import { authClient } from "@/utils/auth-client";

type TeamProfileSearchTab = Exclude<TeamProfileTab, "overview"> | undefined;

const TEAM_NUMBER_PATTERN = /^\d{5}$/;

const PUBLIC_TABS = new Set<TeamProfileTab>(["overview", "roster", "history", "media"]);
const MANAGER_TABS = new Set<TeamProfileTab>(["manage", "invitations"]);

const normalizeTeamProfileTab = (tab: unknown): TeamProfileSearchTab => {
  if (
    tab === "roster" ||
    tab === "history" ||
    tab === "media" ||
    tab === "manage" ||
    tab === "invitations"
  ) {
    return tab;
  }

  return undefined;
};

const toActiveTab = (tab: TeamProfileSearchTab, showManageTabs: boolean): TeamProfileTab => {
  if (!tab) {
    return "overview";
  }

  if (PUBLIC_TABS.has(tab)) {
    return tab;
  }

  return showManageTabs && MANAGER_TABS.has(tab) ? tab : "overview";
};

const TeamProfilePage = () => {
  const { t } = useTranslation();
  const { teamNumber } = useParams({ from: "/{-$locale}/teams/$teamNumber" });
  const { tab: rawTab } = useSearch({ from: "/{-$locale}/teams/$teamNumber" });
  const session = authClient.useSession();
  const isValidTeamNumber = TEAM_NUMBER_PATTERN.test(teamNumber);
  const teamQuery = usePublicTeamProfile(teamNumber, isValidTeamNumber);
  const tab = normalizeTeamProfileTab(rawTab);

  if (!isValidTeamNumber) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">{t("routes.team.invalidTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("routes.team.invalidDescription")}</p>
      </div>
    );
  }

  if (teamQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("routes.team.loading")}</p>
      </div>
    );
  }

  if (teamQuery.error || !teamQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">{t("routes.team.notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("routes.team.description")}</p>
      </div>
    );
  }

  const teamData = teamQuery.data;
  const currentUserId = session.data?.user?.id;

  const currentMember = currentUserId
    ? teamData.members.find((m) => m.userId === currentUserId)
    : undefined;

  const membershipRole = currentMember?.role ?? null;
  const showManageTabs = canManageTeam(membershipRole);
  const activeTab = toActiveTab(tab, showManageTabs);

  const renderOverview = () => (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("routes.team.about")}</h2>
          {teamData.description ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {teamData.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("routes.team.noDescription")}</p>
          )}
        </section>
      </div>

      <aside className="space-y-4 lg:col-span-4">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-base font-semibold">{t("routes.team.profileDetails")}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("routes.team.schoolOrOrganization")}
              </dt>
              <dd className="mt-0.5 text-foreground">
                {teamData.schoolOrOrganization ?? t("routes.team.notProvided")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("routes.team.cityOrProvince")}</dt>
              <dd className="mt-0.5 text-foreground">
                {teamData.cityOrProvince ?? t("routes.team.notProvided")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("routes.team.teamNumber")}</dt>
              <dd className="mt-0.5 text-foreground">{teamData.teamNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("routes.team.created")}</dt>
              <dd className="mt-0.5 text-foreground">
                {new Date(teamData.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "roster": {
        return (
          <TeamMembersList
            currentUserId={currentUserId}
            members={teamData.members}
            membershipRole={membershipRole}
            showActions={false}
          />
        );
      }
      case "history": {
        return <TeamHistoryPlaceholder />;
      }
      case "media": {
        return (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">{t("routes.team.media")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("routes.team.galleryUnavailable")}
            </p>
          </section>
        );
      }
      case "manage": {
        return (
          <div className="space-y-6">
            <TeamProfileForm team={teamData} />
            <TeamMembersList
              currentUserId={currentUserId}
              members={teamData.members}
              membershipRole={membershipRole}
              showActions
            />
          </div>
        );
      }
      case "invitations": {
        return (
          <TeamInvitationsPanel canInvite={canInviteToTeam(membershipRole)} teamId={teamData.id} />
        );
      }
      default: {
        return renderOverview();
      }
    }
  };

  return (
    <TeamProfileShell activeTab={activeTab} showManageTabs={showManageTabs} team={teamData}>
      {renderContent()}
    </TeamProfileShell>
  );
};

export const Route = createFileRoute("/{-$locale}/teams/$teamNumber")({
  component: TeamProfilePage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: normalizeTeamProfileTab(search.tab),
  }),
});
