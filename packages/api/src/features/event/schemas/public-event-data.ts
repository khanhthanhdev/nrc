import * as v from "valibot";

import { eventCodeSchema, seasonYearSchema } from "./event.js";

const matchPhaseSchema = v.picklist(["PRACTICE", "QUALIFICATION", "PLAYOFF"]);

export const listPublicMatchesInputSchema = v.object({
  eventCode: eventCodeSchema,
  phase: v.optional(matchPhaseSchema),
  season: seasonYearSchema,
});

export const getPublicMatchDetailInputSchema = v.object({
  eventCode: eventCodeSchema,
  matchKey: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(20)),
  season: seasonYearSchema,
});

export const listPublicRankingsInputSchema = v.object({
  eventCode: eventCodeSchema,
  season: seasonYearSchema,
});

export const listPublicAwardsInputSchema = v.object({
  eventCode: eventCodeSchema,
  season: seasonYearSchema,
});

export type ListPublicMatchesInput = v.InferOutput<typeof listPublicMatchesInputSchema>;
export type GetPublicMatchDetailInput = v.InferOutput<typeof getPublicMatchDetailInputSchema>;
export type ListPublicRankingsInput = v.InferOutput<typeof listPublicRankingsInputSchema>;
export type ListPublicAwardsInput = v.InferOutput<typeof listPublicAwardsInputSchema>;
