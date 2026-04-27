import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../../../shared/procedure.js";
import {
  completeOnboardingByUserId,
  getOnboardingProfileByUserId,
} from "../application/onboarding.js";
import {
  createManagedUserForAdmin,
  getManagedUserForAdmin,
  listManagedUsersForAdmin,
  saveManagedUserForAdmin,
} from "../application/managed-users.js";
import {
  createManagedUserInputSchema,
  getManagedUserInputSchema,
  getManagedUsersInputSchema,
  saveManagedUserInputSchema,
} from "../schemas/managed-users.js";
import { completeOnboardingInputSchema } from "../schemas/onboarding.js";

const requireUserId = (session: { session: { userId: string } } | null): string => {
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in to access this resource.",
    });
  }

  return session.session.userId;
};

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

export const authRouter = {
  completeOnboarding: publicProcedure
    .input(completeOnboardingInputSchema)
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context.session);
      await completeOnboardingByUserId(userId, input);

      return { success: true };
    }),

  createManagedUser: publicProcedure
    .input(createManagedUserInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return createManagedUserForAdmin(context.authAdmin, input);
    }),

  getManagedUser: publicProcedure.input(getManagedUserInputSchema).handler(({ context, input }) => {
    requireAdminSession(context.session);

    return getManagedUserForAdmin(input);
  }),

  getManagedUsers: publicProcedure
    .input(getManagedUsersInputSchema)
    .handler(({ context, input }) => {
      requireAdminSession(context.session);

      return listManagedUsersForAdmin(input);
    }),

  getOnboardingProfile: publicProcedure.handler(async ({ context }) => {
    const userId = requireUserId(context.session);
    const profile = await getOnboardingProfileByUserId(userId);

    if (!profile) {
      throw new ORPCError("NOT_FOUND", {
        message: "User profile not found.",
      });
    }

    return profile;
  }),

  saveManagedUser: publicProcedure
    .input(saveManagedUserInputSchema)
    .handler(({ context, input }) => {
      const currentSession = requireAdminSession(context.session);

      return saveManagedUserForAdmin({
        actorUserId: currentSession.session.userId,
        authAdmin: context.authAdmin,
        input,
      });
    }),
};
