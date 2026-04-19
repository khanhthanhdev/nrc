import * as v from "valibot";

export const createTeamInputSchema = v.object({
  cityOrProvince: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255))),
  description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(2000))),
  name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
  schoolOrOrganization: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255))),
  termsAccepted: v.literal(true),
});

export type CreateTeamInput = v.InferOutput<typeof createTeamInputSchema>;
