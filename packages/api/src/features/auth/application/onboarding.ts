import { db, user } from "@nrc-full/db";
import { eq } from "drizzle-orm";

import type { CompleteOnboardingInput } from "../schemas/onboarding.js";

export interface OnboardingProfile {
  address: string;
  city: string;
  dateOfBirth: string;
  onboardingCompleted: boolean;
  organizationOrSchool: string;
  phone: string;
}

export const getOnboardingProfileByUserId = async (
  userId: string,
): Promise<OnboardingProfile | null> => {
  const [profile] = await db
    .select({
      address: user.address,
      city: user.city,
      dateOfBirth: user.dateOfBirth,
      onboardingCompleted: user.onboardingCompleted,
      organizationOrSchool: user.organizationOrSchool,
      phone: user.phone,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!profile) {
    return null;
  }

  return {
    address: profile.address,
    city: profile.city,
    dateOfBirth: profile.dateOfBirth,
    onboardingCompleted: profile.onboardingCompleted,
    organizationOrSchool: profile.organizationOrSchool,
    phone: profile.phone,
  };
};

export const completeOnboardingByUserId = async (
  userId: string,
  input: CompleteOnboardingInput,
): Promise<void> => {
  await db
    .update(user)
    .set({
      address: input.address,
      city: input.city,
      dateOfBirth: input.dateOfBirth,
      onboardingCompleted: true,
      organizationOrSchool: input.organizationOrSchool,
      phone: input.phone,
    })
    .where(eq(user.id, userId));
};
