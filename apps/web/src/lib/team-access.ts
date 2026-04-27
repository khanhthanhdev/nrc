import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/utils/auth-client";
import { orpc } from "@/utils/orpc";

export const useCurrentTeamSummary = () => {
  const session = authClient.useSession();

  return useQuery({
    ...orpc.team.getMyTeam.queryOptions(),
    enabled: Boolean(session.data),
    retry: false,
  });
};

export const usePublicTeamList = (page: number, search?: string, enabled = true) =>
  useQuery({
    ...orpc.team.listPublicTeams.queryOptions({
      input: { limit: 20, page, search: search || undefined },
    }),
    enabled,
    retry: false,
  });

export const usePublicTeamProfile = (teamNumber: string, enabled = true) =>
  useQuery({
    ...orpc.team.getPublicTeam.queryOptions({
      input: { teamNumber },
    }),
    enabled: enabled && teamNumber.length > 0,
    retry: false,
  });
