import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../../../shared/procedure.js";
import {
  createTeamForUser,
  getMyTeamByUser,
  getPublicTeamByTeamNumber,
  inviteTeamMember,
  listPublicTeams,
  listTeamInvitations,
  listTeamMembers,
  removeTeamMember,
  revokeTeamInvitation,
  updateTeamProfile,
} from "../application/team.js";
import {
  createTeamInputSchema,
  getPublicTeamInputSchema,
  inviteTeamMemberInputSchema,
  listPublicTeamsInputSchema,
  listTeamInvitationsInputSchema,
  listTeamMembersInputSchema,
  removeTeamMemberInputSchema,
  revokeTeamInvitationInputSchema,
  updateTeamProfileInputSchema,
} from "../schemas/team.js";

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

  getPublicTeam: publicProcedure
    .input(getPublicTeamInputSchema)
    .handler(({ input }) => getPublicTeamByTeamNumber(input)),

  inviteTeamMember: publicProcedure
    .input(inviteTeamMemberInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return inviteTeamMember(currentSession.session.userId, input);
    }),

  listPublicTeams: publicProcedure
    .input(listPublicTeamsInputSchema)
    .handler(({ input }) => listPublicTeams(input)),

  listTeamInvitations: publicProcedure
    .input(listTeamInvitationsInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return listTeamInvitations(currentSession.session.userId, input);
    }),

  listTeamMembers: publicProcedure
    .input(listTeamMembersInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return listTeamMembers(currentSession.session.userId, input);
    }),

  removeTeamMember: publicProcedure
    .input(removeTeamMemberInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return removeTeamMember(currentSession.session.userId, input);
    }),

  revokeTeamInvitation: publicProcedure
    .input(revokeTeamInvitationInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return revokeTeamInvitation(currentSession.session.userId, input);
    }),

  updateTeamProfile: publicProcedure
    .input(updateTeamProfileInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return updateTeamProfile(currentSession.session.userId, input);
    }),
};
