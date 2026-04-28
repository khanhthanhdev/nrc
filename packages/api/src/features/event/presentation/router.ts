import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../../../shared/procedure.js";
import {
  createEventAnnouncementForAdmin,
  createEventDocumentForAdmin,
  createEventForAdmin,
  createRegistrationFormVersionForAdmin,
  deleteEventAnnouncementForAdmin,
  deleteEventDocumentForAdmin,
  deleteEventForAdmin,
  deleteRegistrationFormVersionForAdmin,
  getAdminEventById,
  getPublicEventBySeasonAndCode,
  listAdminEvents,
  publishRegistrationFormVersionForAdmin,
  updateEventAnnouncementForAdmin,
  updateEventDocumentForAdmin,
  updateEventForAdmin,
  updateRegistrationFormVersionForAdmin,
} from "../application/event.js";
import {
  getPublicMatchDetail,
  listPublicAwards,
  listPublicMatches,
  listPublicRankings,
} from "../application/public-event-data.js";
import {
  createEventAnnouncementInputSchema,
  createEventDocumentInputSchema,
  createEventInputSchema,
  createRegistrationFormVersionInputSchema,
  deleteEventAnnouncementInputSchema,
  deleteEventDocumentInputSchema,
  deleteEventInputSchema,
  deleteRegistrationFormVersionInputSchema,
  getAdminEventInputSchema,
  getPublicEventInputSchema,
  listAdminEventsInputSchema,
  publishRegistrationFormVersionInputSchema,
  updateEventAnnouncementInputSchema,
  updateEventDocumentInputSchema,
  updateEventInputSchema,
  updateRegistrationFormVersionInputSchema,
} from "../schemas/event.js";
import {
  getPublicMatchDetailInputSchema,
  listPublicAwardsInputSchema,
  listPublicMatchesInputSchema,
  listPublicRankingsInputSchema,
} from "../schemas/public-event-data.js";

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

export const eventRouter = {
  createEvent: publicProcedure.input(createEventInputSchema).handler(({ context, input }) => {
    requireAdminSession(context.session);

    return createEventForAdmin(input);
  }),

  createEventAnnouncement: publicProcedure
    .input(createEventAnnouncementInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return createEventAnnouncementForAdmin(input);
    }),

  createEventDocument: publicProcedure
    .input(createEventDocumentInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return createEventDocumentForAdmin(input);
    }),

  createRegistrationFormVersion: publicProcedure
    .input(createRegistrationFormVersionInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireAdminSession(context.session);

      return createRegistrationFormVersionForAdmin(currentSession.session.userId, input);
    }),

  deleteEvent: publicProcedure.input(deleteEventInputSchema).handler(({ context, input }) => {
    const currentSession = requireAdminSession(context.session);

    return deleteEventForAdmin(currentSession.session.userId, input);
  }),

  deleteEventAnnouncement: publicProcedure
    .input(deleteEventAnnouncementInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireAdminSession(context.session);

      return deleteEventAnnouncementForAdmin(currentSession.session.userId, input);
    }),

  deleteEventDocument: publicProcedure
    .input(deleteEventDocumentInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireAdminSession(context.session);

      return deleteEventDocumentForAdmin(currentSession.session.userId, input);
    }),

  deleteRegistrationFormVersion: publicProcedure
    .input(deleteRegistrationFormVersionInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireAdminSession(context.session);

      return deleteRegistrationFormVersionForAdmin(currentSession.session.userId, input);
    }),

  getAdminEvent: publicProcedure.input(getAdminEventInputSchema).handler(({ context, input }) => {
    requireAdminSession(context.session);

    return getAdminEventById(input.id);
  }),

  getPublicEvent: publicProcedure
    .input(getPublicEventInputSchema)
    .handler(({ input }) => getPublicEventBySeasonAndCode(input.season, input.eventCode)),

  getPublicMatchDetail: publicProcedure
    .input(getPublicMatchDetailInputSchema)
    .handler(({ input }) => getPublicMatchDetail(input.season, input.eventCode, input.matchKey)),

  listAdminEvents: publicProcedure
    .input(listAdminEventsInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return listAdminEvents(input);
    }),

  publishRegistrationFormVersion: publicProcedure
    .input(publishRegistrationFormVersionInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return publishRegistrationFormVersionForAdmin(input);
    }),

  updateEvent: publicProcedure.input(updateEventInputSchema).handler(({ context, input }) => {
    requireAdminSession(context.session);

    return updateEventForAdmin(input);
  }),

  updateEventAnnouncement: publicProcedure
    .input(updateEventAnnouncementInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return updateEventAnnouncementForAdmin(input);
    }),

  updateEventDocument: publicProcedure
    .input(updateEventDocumentInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return updateEventDocumentForAdmin(input);
    }),

  updateRegistrationFormVersion: publicProcedure
    .input(updateRegistrationFormVersionInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return updateRegistrationFormVersionForAdmin(input);
    }),

  listPublicAwards: publicProcedure
    .input(listPublicAwardsInputSchema)
    .handler(({ input }) => listPublicAwards(input.season, input.eventCode)),

  listPublicMatches: publicProcedure
    .input(listPublicMatchesInputSchema)
    .handler(({ input }) => listPublicMatches(input.season, input.eventCode, input.phase)),

  listPublicRankings: publicProcedure
    .input(listPublicRankingsInputSchema)
    .handler(({ input }) => listPublicRankings(input.season, input.eventCode)),
};
