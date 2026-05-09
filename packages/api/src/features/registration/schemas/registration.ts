import * as v from "valibot";

const trimmedString = (maxLength: number) =>
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(maxLength));

const jsonObjectSchema = v.pipe(
  v.unknown(),
  v.check(
    (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value),
    "Payload must be a JSON object.",
  ),
  v.transform((value) => value as Record<string, unknown>),
);

// ── Public / Team-mentor registration schemas ──────────────────────────

export const createRegistrationInputSchema = v.object({
  eventId: trimmedString(128),
  payload: jsonObjectSchema,
  teamId: trimmedString(128),
});

export const getRegistrationInputSchema = v.object({
  registrationId: trimmedString(128),
});

export const listTeamRegistrationsInputSchema = v.object({
  teamId: trimmedString(128),
});

export const submitRegistrationInputSchema = v.object({
  registrationId: trimmedString(128),
});

export const updateRegistrationRevisionInputSchema = v.object({
  payload: jsonObjectSchema,
  registrationId: trimmedString(128),
});

export const withdrawRegistrationInputSchema = v.object({
  registrationId: trimmedString(128),
});

export const listRegistrationReviewActionsInputSchema = v.object({
  registrationId: trimmedString(128),
});

// ── Admin registration review schemas ──────────────────────────────────

export const listAdminRegistrationsByEventInputSchema = v.object({
  eventId: trimmedString(128),
  status: v.optional(
    v.picklist([
      "draft",
      "submitted",
      "under_review",
      "needs_revision",
      "approved",
      "denied",
      "withdrawn",
    ]),
  ),
});

export const reviewRegistrationInputSchema = v.object({
  action: v.picklist(["approve", "deny", "request_changes"]),
  comment: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(4000))),
  registrationId: trimmedString(128),
});

export const addRegistrationCommentInputSchema = v.object({
  comment: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(4000)),
  isVisibleToTeam: v.optional(v.boolean(), true),
  registrationId: trimmedString(128),
});

// ── Public event listing schema ────────────────────────────────────────

export const listPublicEventsInputSchema = v.optional(
  v.object({
    limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20),
    page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
    season: v.optional(v.pipe(v.string(), v.trim(), v.regex(/^\d{4}$/, "Season must be a 4-digit year."))),
    status: v.optional(
      v.picklist([
        "published",
        "registration_open",
        "registration_closed",
        "active",
        "completed",
        "archived",
      ]),
    ),
  }),
  {},
);

// ── Inferred types ─────────────────────────────────────────────────────

export type CreateRegistrationInput = v.InferOutput<typeof createRegistrationInputSchema>;
export type GetRegistrationInput = v.InferOutput<typeof getRegistrationInputSchema>;
export type ListTeamRegistrationsInput = v.InferOutput<typeof listTeamRegistrationsInputSchema>;
export type SubmitRegistrationInput = v.InferOutput<typeof submitRegistrationInputSchema>;
export type UpdateRegistrationRevisionInput = v.InferOutput<
  typeof updateRegistrationRevisionInputSchema
>;
export type WithdrawRegistrationInput = v.InferOutput<typeof withdrawRegistrationInputSchema>;
export type ListRegistrationReviewActionsInput = v.InferOutput<
  typeof listRegistrationReviewActionsInputSchema
>;
export type ListAdminRegistrationsByEventInput = v.InferOutput<
  typeof listAdminRegistrationsByEventInputSchema
>;
export type ReviewRegistrationInput = v.InferOutput<typeof reviewRegistrationInputSchema>;
export type AddRegistrationCommentInput = v.InferOutput<typeof addRegistrationCommentInputSchema>;
export type ListPublicEventsInput = v.InferOutput<typeof listPublicEventsInputSchema>;
