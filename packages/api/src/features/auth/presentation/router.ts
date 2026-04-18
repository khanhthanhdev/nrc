import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../../../shared/procedure.js";
import { completeOnboardingByUserId, getOnboardingProfileByUserId } from "../application/onboarding.js";
import { completeOnboardingInputSchema } from "../schemas/onboarding.js";

const requireUserId = (session: { session: { userId: string } } | null): string => {
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in to access this resource.",
    });
  }

  return session.session.userId;
};

export const authRouter = {
  completeOnboarding: publicProcedure
    .input(completeOnboardingInputSchema)
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context.session);
      await completeOnboardingByUserId(userId, input);

      return { success: true };
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
};
