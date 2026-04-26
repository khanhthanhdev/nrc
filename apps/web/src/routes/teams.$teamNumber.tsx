import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { usePublicTeamProfile } from "@/lib/team-access";
import { canInviteToTeam, canManageTeam } from "@/lib/route-policy";
import { TeamProfileShell } from "@/features/teams/team-profile-shell";
import { TeamMembersList } from "@/features/teams/team-members-list";
import { TeamProfileForm } from "@/features/teams/team-profile-form";
import { TeamInvitationsPanel } from "@/features/teams/team-invitations-panel";
import { TeamHistoryPlaceholder } from "@/features/teams/team-history-placeholder";

const TeamProfilePage = () => {
  const { teamNumber } = useParams({ from: "/teams/$teamNumber" });
  const { tab } = useSearch({ from: "/teams/$teamNumber" });
  const session = authClient.useSession();
  const teamQuery = usePublicTeamProfile(teamNumber);

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

  const renderContent = () => {
    if (tab === "manage" && showManageTabs) {
      return <TeamProfileForm team={teamData} />;
    }

    if (tab === "invitations" && showManageTabs) {
      return (
        <TeamInvitationsPanel
          canInvite={canInviteToTeam(membershipRole)}
          teamId={teamData.id}
        />
      );
    }

    return (
      <div className="space-y-6">
        {teamData.description && (
          <div className="nrc-card-subtle p-4">
            <h2 className="text-lg font-semibold">About</h2>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {teamData.description}
            </p>
          </div>
        )}

        <TeamMembersList
          currentUserId={currentUserId}
          members={teamData.members}
          membershipRole={membershipRole}
          showActions={showManageTabs}
        />

        <TeamHistoryPlaceholder />
      </div>
    );
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
    tab: (search.tab as string) || undefined,
  }),
});
