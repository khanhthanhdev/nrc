import { client } from "@/utils/orpc";

export const resolvePostAuthRoute = async (): Promise<"/" | "/onboarding"> => {
  try {
    const profile = await client.auth.getOnboardingProfile();

    return profile.onboardingCompleted ? "/" : "/onboarding";
  } catch {
    return "/onboarding";
  }
};
