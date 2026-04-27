import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { usePublicTeamProfile } from "@/lib/team-access";
import { canInviteToTeam, canManageTeam } from "@/lib/route-policy";
import { TeamProfileShell } from "@/features/teams/team-profile-shell";
import { TeamMembersList } from "@/features/teams/team-members-list";
import { TeamProfileForm } from "@/features/teams/team-profile-form";
import { TeamInvitationsPanel } from "@/features/teams/team-invitations-panel";
import { TeamHistoryPlaceholder } from "@/features/teams/team-history-placeholder";

type TeamProfileTab = "invitations" | "manage" | undefined;

const TEAM_NUMBER_PATTERN = /^\d{5}$/;

const normalizeTeamProfileTab = (tab: unknown): TeamProfileTab => {
  if (tab === "manage" || tab === "invitations") {
    return tab;
  }

  return undefined;
};

const TeamProfilePage = () => {
  const { teamNumber } = useParams({ from: "/teams/$teamNumber" });
  const { tab: rawTab } = useSearch({ from: "/teams/$teamNumber" });
  const session = authClient.useSession();
  const isValidTeamNumber = TEAM_NUMBER_PATTERN.test(teamNumber);
  const teamQuery = usePublicTeamProfile(teamNumber, isValidTeamNumber);
  const tab = normalizeTeamProfileTab(rawTab);

  if (!isValidTeamNumber) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Invalid team number</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Team URLs must use the five-digit format (example: 02323).
        </p>
      </div>
    );
  }

  if (teamQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading team...</p>
      </div>
    );
  }

  if (teamQuery.error || !teamQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Team not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This team does not exist or has been removed.
        </p>
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

  const renderPublicContent = () => (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div className="nrc-card-subtle p-4">
          <h2 className="text-lg font-semibold">Team description</h2>
          {teamData.description ? (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {teamData.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No team description has been published yet.
            </p>
          )}
        </div>

        <TeamHistoryPlaceholder />
      </div>

      <aside className="space-y-6 lg:col-span-4">
        <div className="nrc-card-subtle p-4">
          <h2 className="text-lg font-semibold">School / organization information</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">School or organization</dt>
              <dd className="mt-0.5 text-foreground">
                {teamData.schoolOrOrganization ?? "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">City or province</dt>
              <dd className="mt-0.5 text-foreground">
                {teamData.cityOrProvince ?? "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Team number</dt>
              <dd className="mt-0.5 text-foreground">{teamData.teamNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="mt-0.5 text-foreground">
                {new Date(teamData.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <TeamMembersList
          currentUserId={currentUserId}
          members={teamData.members}
          membershipRole={membershipRole}
          showActions={false}
        />
      </aside>
    </div>
  );

  const renderContent = () => {
    if (tab === "manage" && showManageTabs) {
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

    if (tab === "invitations" && showManageTabs) {
      return (
        <TeamInvitationsPanel canInvite={canInviteToTeam(membershipRole)} teamId={teamData.id} />
      );
    }

    return renderPublicContent();
  };

  return (
    <TeamProfileShell showManageTabs={showManageTabs} team={teamData}>
      {renderContent()}
    </TeamProfileShell>
  );
};

export const Route = createFileRoute("/teams/$teamNumber")({
  component: TeamProfilePage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: normalizeTeamProfileTab(search.tab),
  }),
});
