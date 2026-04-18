import * as v from "valibot";

import { VIETNAM_34_CITIES } from "../contracts/vietnam-cities.js";

const DATE_OF_BIRTH_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const completeOnboardingInputSchema = v.object({
  address: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255)),
  city: v.picklist(VIETNAM_34_CITIES),
  dateOfBirth: v.pipe(v.string(), v.regex(DATE_OF_BIRTH_REGEX, "Invalid date format")),
  organizationOrSchool: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255)),
  phone: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(30)),
});

export type CompleteOnboardingInput = v.InferOutput<typeof completeOnboardingInputSchema>;
