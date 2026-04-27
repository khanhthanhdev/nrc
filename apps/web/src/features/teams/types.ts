import type { client } from "@/utils/orpc";

export type PublicTeamListData = Awaited<ReturnType<typeof client.team.listPublicTeams>>;
export type PublicTeamSummary = PublicTeamListData["teams"][number];
export type PublicTeamProfileData = Awaited<ReturnType<typeof client.team.getPublicTeam>>;
export type PublicTeamMember = PublicTeamProfileData["members"][number];
export type TeamInvitationData = Awaited<
  ReturnType<typeof client.team.listTeamInvitations>
>[number];
export type TeamMemberData = Awaited<ReturnType<typeof client.team.listTeamMembers>>[number];
