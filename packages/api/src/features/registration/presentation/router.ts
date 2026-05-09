import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../../../shared/procedure.js";
import {
  addRegistrationComment,
  createRegistration,
  getAdminRegistrationDetail,
  getEventRegistrationForm,
  getRegistrationDetail,
  getTeamEventRegistrationStatus,
  listAdminRegistrationsByEvent,
  listRegistrationReviewActions,
  listTeamRegistrations,
  reviewRegistration,
  submitRegistration,
  updateRegistrationRevision,
  withdrawRegistration,
} from "../application/registration.js";
import { listPublicEvents } from "../application/public-events.js";
import {
  addRegistrationCommentInputSchema,
  createRegistrationInputSchema,
  getEventRegistrationFormInputSchema,
  getRegistrationInputSchema,
  getTeamEventRegistrationStatusInputSchema,
  listAdminRegistrationsByEventInputSchema,
  listPublicEventsInputSchema,
  listRegistrationReviewActionsInputSchema,
  listTeamRegistrationsInputSchema,
  reviewRegistrationInputSchema,
  submitRegistrationInputSchema,
  updateRegistrationRevisionInputSchema,
  withdrawRegistrationInputSchema,
} from "../schemas/registration.js";

const requireSession = (
  session: { session: { id: string; userId: string } } | null,
) => {
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in to access this resource.",
    });
  }

  return session;
};

const requireStaffSession = (
  session: { session: { userId: string }; user: { systemRole?: string | null } } | null,
) => {
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in to access this resource.",
    });
  }

  if (session.user.systemRole !== "ADMIN" && session.user.systemRole !== "MANAGER") {
    throw new ORPCError("FORBIDDEN", {
      message: "You must be a staff member to access this resource.",
    });
  }

  return session;
};

export const registrationRouter = {
  // ── Team-facing registration routes ────────────────────────────────

  createRegistration: publicProcedure
    .input(createRegistrationInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return createRegistration(currentSession.session.userId, input);
    }),

  getRegistration: publicProcedure
    .input(getRegistrationInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return getRegistrationDetail(currentSession.session.userId, input.registrationId);
    }),

  listTeamRegistrations: publicProcedure
    .input(listTeamRegistrationsInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return listTeamRegistrations(currentSession.session.userId, input);
    }),

  submitRegistration: publicProcedure
    .input(submitRegistrationInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return submitRegistration(currentSession.session.userId, input.registrationId);
    }),

  updateRegistrationRevision: publicProcedure
    .input(updateRegistrationRevisionInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return updateRegistrationRevision(currentSession.session.userId, input);
    }),

  withdrawRegistration: publicProcedure
    .input(withdrawRegistrationInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return withdrawRegistration(currentSession.session.userId, input);
    }),

  listRegistrationReviewActions: publicProcedure
    .input(listRegistrationReviewActionsInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return listRegistrationReviewActions(currentSession.session.userId, input);
    }),

  // ── Admin registration review routes ───────────────────────────────

  listAdminRegistrationsByEvent: publicProcedure
    .input(listAdminRegistrationsByEventInputSchema)
    .handler(({ context, input }) => {
      requireStaffSession(context.session);

      return listAdminRegistrationsByEvent(input);
    }),

  getAdminRegistrationDetail: publicProcedure
    .input(getRegistrationInputSchema)
    .handler(({ context, input }) => {
      requireStaffSession(context.session);

      return getAdminRegistrationDetail(input.registrationId);
    }),

  reviewRegistration: publicProcedure
    .input(reviewRegistrationInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireStaffSession(context.session);

      return reviewRegistration(currentSession.session.userId, input);
    }),

  addRegistrationComment: publicProcedure
    .input(addRegistrationCommentInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireStaffSession(context.session);

      return addRegistrationComment(currentSession.session.userId, input);
    }),

  // ── Public event listing + form ────────────────────────────────────

  getEventRegistrationForm: publicProcedure
    .input(getEventRegistrationFormInputSchema)
    .handler(({ input }) => getEventRegistrationForm(input.eventId)),

  getTeamEventRegistrationStatus: publicProcedure
    .input(getTeamEventRegistrationStatusInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireSession(context.session);

      return getTeamEventRegistrationStatus(currentSession.session.userId, input);
    }),

  listPublicEvents: publicProcedure
    .input(listPublicEventsInputSchema)
    .handler(({ input }) => listPublicEvents(input)),
};
