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
