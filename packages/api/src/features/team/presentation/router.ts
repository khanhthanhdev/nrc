import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../../../shared/procedure.js";
import { createTeamForUser, getMyTeamByUser } from "../application/team.js";
import { createTeamInputSchema } from "../schemas/team.js";

const requireSession = (
  session: { session: { id: string; userId: string; activeOrganizationId?: string | null } } | null,
) => {
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in to access this resource.",
    });
  }

  return session;
};

export const teamRouter = {
  createTeam: publicProcedure.input(createTeamInputSchema).handler(({ context, input }) => {
    const currentSession = requireSession(context.session);

    return createTeamForUser(currentSession.session.userId, currentSession.session.id, input);
  }),

  getMyTeam: publicProcedure.handler(({ context }) => {
    const currentSession = requireSession(context.session);

    return getMyTeamByUser(
      currentSession.session.userId,
      currentSession.session.activeOrganizationId ?? null,
    );
  }),
};
