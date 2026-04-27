import * as v from "valibot";

const SEASON_PATTERN = /^\d{4}$/;
const EVENT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,49}$/;

const trimmedString = (maxLength: number) =>
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(maxLength));

const optionalTrimmedNullableString = (maxLength: number) =>
  v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(maxLength))));

const validTimestampString = v.pipe(
  v.string(),
  v.trim(),
  v.check((value) => !Number.isNaN(Date.parse(value)), "Expected a valid timestamp."),
);

const optionalTimestampString = v.optional(v.nullable(validTimestampString));

const jsonObjectSchema = v.pipe(
  v.unknown(),
  v.check(
    (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value),
    "Definition must be a JSON object.",
  ),
  v.transform((value) => value as Record<string, unknown>),
);

export const seasonYearSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(SEASON_PATTERN, "Season year must be a 4-digit year."),
);

export const eventCodeSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toUpperCase(),
  v.regex(
    EVENT_CODE_PATTERN,
    "Event code must use uppercase letters, numbers, dashes, or underscores.",
  ),
);

export const eventStatusSchema = v.picklist([
  "draft",
  "published",
  "registration_open",
  "registration_closed",
  "active",
  "completed",
  "archived",
]);

export const sortOrderSchema = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(10_000));

const eventBaseSchema = {
  description: optionalTrimmedNullableString(12_000),
  eventCode: eventCodeSchema,
  eventEndsAt: validTimestampString,
  eventStartsAt: validTimestampString,
  location: optionalTrimmedNullableString(255),
  maxParticipants: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10_000))),
  ),
  name: trimmedString(255),
  registrationEndsAt: optionalTimestampString,
  registrationStartsAt: optionalTimestampString,
  season: seasonYearSchema,
  status: eventStatusSchema,
  summary: optionalTrimmedNullableString(1000),
  timezone: v.optional(v.nullable(trimmedString(100))),
  venue: optionalTrimmedNullableString(255),
};

export const listAdminEventsInputSchema = v.optional(
  v.object({
    includeDeleted: v.optional(v.boolean(), false),
    season: v.optional(seasonYearSchema),
  }),
  {},
);

export const getAdminEventInputSchema = v.object({
  id: trimmedString(128),
});

export const getPublicEventInputSchema = v.object({
  eventCode: eventCodeSchema,
  season: seasonYearSchema,
});

// Note: Database enforces unique constraint on (season, eventCode) combination.
// This prevents duplicate events within the same season.
export const createEventInputSchema = v.strictObject(eventBaseSchema);

export const updateEventInputSchema = v.object({
  ...eventBaseSchema,
  id: trimmedString(128),
});

export const deleteEventInputSchema = v.object({
  id: trimmedString(128),
});

export const createEventDocumentInputSchema = v.object({
  eventId: trimmedString(128),
  isPublic: v.optional(v.boolean(), true),
  kind: trimmedString(80),
  sortOrder: v.optional(sortOrderSchema, 0),
  title: trimmedString(255),
  url: v.pipe(v.string(), v.trim(), v.url(), v.maxLength(2000)),
});

export const updateEventDocumentInputSchema = v.object({
  eventId: trimmedString(128),
  id: trimmedString(128),
  isPublic: v.boolean(),
  kind: trimmedString(80),
  sortOrder: sortOrderSchema,
  title: trimmedString(255),
  url: v.pipe(v.string(), v.trim(), v.url(), v.maxLength(2000)),
});

export const deleteEventDocumentInputSchema = v.object({
  eventId: trimmedString(128),
  id: trimmedString(128),
});

export const createEventAnnouncementInputSchema = v.object({
  body: trimmedString(10_000),
  eventId: trimmedString(128),
  isPinned: v.optional(v.boolean(), false),
  publishedAt: validTimestampString,
  title: trimmedString(255),
});

export const updateEventAnnouncementInputSchema = v.object({
  body: trimmedString(10_000),
  eventId: trimmedString(128),
  id: trimmedString(128),
  isPinned: v.boolean(),
  publishedAt: validTimestampString,
  title: trimmedString(255),
});

export const deleteEventAnnouncementInputSchema = v.object({
  eventId: trimmedString(128),
  id: trimmedString(128),
});

export const createRegistrationFormVersionInputSchema = v.object({
  definition: jsonObjectSchema,
  eventId: trimmedString(128),
  isPublished: v.optional(v.boolean(), false),
});

export const updateRegistrationFormVersionInputSchema = v.object({
  definition: jsonObjectSchema,
  eventId: trimmedString(128),
  id: trimmedString(128),
});

export const publishRegistrationFormVersionInputSchema = v.object({
  eventId: trimmedString(128),
  id: trimmedString(128),
});

export const deleteRegistrationFormVersionInputSchema = v.object({
  eventId: trimmedString(128),
  id: trimmedString(128),
});

export type ListAdminEventsInput = v.InferOutput<typeof listAdminEventsInputSchema>;
export type GetAdminEventInput = v.InferOutput<typeof getAdminEventInputSchema>;
export type GetPublicEventInput = v.InferOutput<typeof getPublicEventInputSchema>;
export type CreateEventInput = v.InferOutput<typeof createEventInputSchema>;
export type UpdateEventInput = v.InferOutput<typeof updateEventInputSchema>;
export type DeleteEventInput = v.InferOutput<typeof deleteEventInputSchema>;
export type CreateEventDocumentInput = v.InferOutput<typeof createEventDocumentInputSchema>;
export type UpdateEventDocumentInput = v.InferOutput<typeof updateEventDocumentInputSchema>;
export type DeleteEventDocumentInput = v.InferOutput<typeof deleteEventDocumentInputSchema>;
export type CreateEventAnnouncementInput = v.InferOutput<typeof createEventAnnouncementInputSchema>;
export type UpdateEventAnnouncementInput = v.InferOutput<typeof updateEventAnnouncementInputSchema>;
export type DeleteEventAnnouncementInput = v.InferOutput<typeof deleteEventAnnouncementInputSchema>;
export type CreateRegistrationFormVersionInput = v.InferOutput<
  typeof createRegistrationFormVersionInputSchema
>;
export type UpdateRegistrationFormVersionInput = v.InferOutput<
  typeof updateRegistrationFormVersionInputSchema
>;
export type PublishRegistrationFormVersionInput = v.InferOutput<
  typeof publishRegistrationFormVersionInputSchema
>;
export type DeleteRegistrationFormVersionInput = v.InferOutput<
  typeof deleteRegistrationFormVersionInputSchema
>;
