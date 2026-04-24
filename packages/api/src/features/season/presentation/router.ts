import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../../../shared/procedure.js";
import {
  createSeasonAnnouncementForAdmin,
  createSeasonDocumentForAdmin,
  createSeasonForAdmin,
  deleteSeasonAnnouncementForAdmin,
  deleteSeasonDocumentForAdmin,
  deleteSeasonForAdmin,
  getAdminSeasonByYear,
  getPublicSeasonPageByYear,
  listAdminSeasons,
  updateSeasonAnnouncementForAdmin,
  updateSeasonDocumentForAdmin,
  updateSeasonForAdmin,
} from "../application/season.js";
import {
  createSeasonAnnouncementInputSchema,
  createSeasonDocumentInputSchema,
  createSeasonInputSchema,
  deleteSeasonAnnouncementInputSchema,
  deleteSeasonDocumentInputSchema,
  deleteSeasonInputSchema,
  getAdminSeasonInputSchema,
  getPublicSeasonPageInputSchema,
  listAdminSeasonsInputSchema,
  updateSeasonAnnouncementInputSchema,
  updateSeasonDocumentInputSchema,
  updateSeasonInputSchema,
} from "../schemas/season.js";

const requireAdminSession = (
  session: { session: { userId: string }; user: { systemRole?: string | null } } | null,
) => {
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in to access this resource.",
    });
  }

  if (session.user.systemRole !== "ADMIN") {
    throw new ORPCError("FORBIDDEN", {
      message: "You must be an admin to access this resource.",
    });
  }

  return session;
};

export const seasonRouter = {
  createSeason: publicProcedure.input(createSeasonInputSchema).handler(({ context, input }) => {
    requireAdminSession(context.session);

    return createSeasonForAdmin(input);
  }),

  createSeasonAnnouncement: publicProcedure
    .input(createSeasonAnnouncementInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return createSeasonAnnouncementForAdmin(input);
    }),

  createSeasonDocument: publicProcedure
    .input(createSeasonDocumentInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return createSeasonDocumentForAdmin(input);
    }),

  deleteSeason: publicProcedure.input(deleteSeasonInputSchema).handler(({ context, input }) => {
    const currentSession = requireAdminSession(context.session);

    return deleteSeasonForAdmin(currentSession.session.userId, input);
  }),

  deleteSeasonAnnouncement: publicProcedure
    .input(deleteSeasonAnnouncementInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireAdminSession(context.session);

      return deleteSeasonAnnouncementForAdmin(currentSession.session.userId, input);
    }),

  deleteSeasonDocument: publicProcedure
    .input(deleteSeasonDocumentInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireAdminSession(context.session);

      return deleteSeasonDocumentForAdmin(currentSession.session.userId, input);
    }),

  getAdminSeason: publicProcedure.input(getAdminSeasonInputSchema).handler(({ context, input }) => {
    requireAdminSession(context.session);

    return getAdminSeasonByYear(input.year);
  }),

  getPublicSeasonPage: publicProcedure
    .input(getPublicSeasonPageInputSchema)
    .handler(({ input }) => getPublicSeasonPageByYear(input.year)),

  listAdminSeasons: publicProcedure
    .input(listAdminSeasonsInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return listAdminSeasons(input);
    }),

  updateSeason: publicProcedure.input(updateSeasonInputSchema).handler(({ context, input }) => {
    requireAdminSession(context.session);

    return updateSeasonForAdmin(input);
  }),

  updateSeasonAnnouncement: publicProcedure
    .input(updateSeasonAnnouncementInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return updateSeasonAnnouncementForAdmin(input);
    }),

  updateSeasonDocument: publicProcedure
    .input(updateSeasonDocumentInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return updateSeasonDocumentForAdmin(input);
    }),
};
