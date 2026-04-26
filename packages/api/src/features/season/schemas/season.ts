import * as v from "valibot";

const SEASON_PATTERN = /^\d{4}$/;

const trimmedString = (maxLength: number) =>
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(maxLength));

const optionalTrimmedNullableString = (maxLength: number) =>
  v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(maxLength))));

const validTimestampString = v.pipe(
  v.string(),
  v.trim(),
  v.check((value) => !Number.isNaN(Date.parse(value)), "Expected a valid timestamp."),
);

export const seasonYearSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(SEASON_PATTERN, "Season year must be a 4-digit year."),
);

export const sortOrderSchema = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(10000));

export const getPublicSeasonPageInputSchema = v.object({
  year: seasonYearSchema,
});

export const listAdminSeasonsInputSchema = v.optional(
  v.object({
    includeDeleted: v.optional(v.boolean(), false),
  }),
  {},
);

export const getAdminSeasonInputSchema = v.object({
  year: seasonYearSchema,
});

// Note: Database enforces unique constraint on year (season).
// This prevents creating duplicate seasons with the same year.
export const createSeasonInputSchema = v.strictObject({
  description: optionalTrimmedNullableString(4000),
  gameCode: trimmedString(50),
  isActive: v.optional(v.boolean(), true),
  theme: trimmedString(255),
  year: seasonYearSchema,
});

export const updateSeasonInputSchema = v.object({
  description: optionalTrimmedNullableString(4000),
  gameCode: trimmedString(50),
  isActive: v.boolean(),
  theme: trimmedString(255),
  year: seasonYearSchema,
});

export const deleteSeasonInputSchema = v.object({
  year: seasonYearSchema,
});

export const createSeasonDocumentInputSchema = v.object({
  kind: trimmedString(80),
  seasonYear: seasonYearSchema,
  sortOrder: v.optional(sortOrderSchema, 0),
  title: trimmedString(255),
  url: v.pipe(v.string(), v.trim(), v.url(), v.maxLength(2000)),
});

export const updateSeasonDocumentInputSchema = v.object({
  id: trimmedString(128),
  kind: trimmedString(80),
  seasonYear: seasonYearSchema,
  sortOrder: sortOrderSchema,
  title: trimmedString(255),
  url: v.pipe(v.string(), v.trim(), v.url(), v.maxLength(2000)),
});

export const deleteSeasonDocumentInputSchema = v.object({
  id: trimmedString(128),
  seasonYear: seasonYearSchema,
});

export const createSeasonAnnouncementInputSchema = v.object({
  body: trimmedString(10000),
  isPinned: v.optional(v.boolean(), false),
  publishedAt: validTimestampString,
  seasonYear: seasonYearSchema,
  sortOrder: v.optional(sortOrderSchema, 0),
  title: trimmedString(255),
});

export const updateSeasonAnnouncementInputSchema = v.object({
  body: trimmedString(10000),
  id: trimmedString(128),
  isPinned: v.boolean(),
  publishedAt: validTimestampString,
  seasonYear: seasonYearSchema,
  sortOrder: sortOrderSchema,
  title: trimmedString(255),
});

export const deleteSeasonAnnouncementInputSchema = v.object({
  id: trimmedString(128),
  seasonYear: seasonYearSchema,
});

export type GetPublicSeasonPageInput = v.InferOutput<typeof getPublicSeasonPageInputSchema>;
export type ListAdminSeasonsInput = v.InferOutput<typeof listAdminSeasonsInputSchema>;
export type GetAdminSeasonInput = v.InferOutput<typeof getAdminSeasonInputSchema>;
export type CreateSeasonInput = v.InferOutput<typeof createSeasonInputSchema>;
export type UpdateSeasonInput = v.InferOutput<typeof updateSeasonInputSchema>;
export type DeleteSeasonInput = v.InferOutput<typeof deleteSeasonInputSchema>;
export type CreateSeasonDocumentInput = v.InferOutput<typeof createSeasonDocumentInputSchema>;
export type UpdateSeasonDocumentInput = v.InferOutput<typeof updateSeasonDocumentInputSchema>;
export type DeleteSeasonDocumentInput = v.InferOutput<typeof deleteSeasonDocumentInputSchema>;
export type CreateSeasonAnnouncementInput = v.InferOutput<
  typeof createSeasonAnnouncementInputSchema
>;
export type UpdateSeasonAnnouncementInput = v.InferOutput<
  typeof updateSeasonAnnouncementInputSchema
>;
export type DeleteSeasonAnnouncementInput = v.InferOutput<
  typeof deleteSeasonAnnouncementInputSchema
>;
