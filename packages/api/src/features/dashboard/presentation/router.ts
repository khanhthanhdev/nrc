import { ORPCError } from "@orpc/server";
import * as v from "valibot";

import type { AuthContextSession } from "../../../shared/context.js";
import { publicProcedure } from "../../../shared/procedure.js";
import { getStaffDashboard, getUserDashboard } from "../application/dashboard.js";

const localeInputSchema = v.optional(
  v.object({
    locale: v.optional(v.picklist(["en", "vi"]), "en"),
  }),
  {},
);

const requireSession = (session: AuthContextSession | null): AuthContextSession => {
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in to access this resource.",
    });
  }

  return session;
};

const requireStaffSession = (session: AuthContextSession | null): AuthContextSession => {
  const currentSession = requireSession(session);

  if (
    currentSession.user.systemRole !== "ADMIN" &&
    currentSession.user.systemRole !== "MANAGER"
  ) {
    throw new ORPCError("FORBIDDEN", {
      message: "You must be a staff member to access this resource.",
    });
  }

  return currentSession;
};

export const dashboardRouter = {
  getStaffDashboard: publicProcedure
    .input(localeInputSchema)
    .handler(({ context, input }) =>
      getStaffDashboard(requireStaffSession(context.session), input?.locale ?? "en"),
    ),
  getUserDashboard: publicProcedure
    .input(localeInputSchema)
    .handler(({ context, input }) =>
      getUserDashboard(requireSession(context.session), input?.locale ?? "en"),
    ),
};
