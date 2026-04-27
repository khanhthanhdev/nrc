import * as v from "valibot";

const TEAM_NUMBER_PATTERN = /^\d{5}$/;

export const createTeamInputSchema = v.object({
  cityOrProvince: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255))),
  description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(2000))),
  name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
  schoolOrOrganization: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255))),
  termsAccepted: v.literal(true),
});

export type CreateTeamInput = v.InferOutput<typeof createTeamInputSchema>;

export const updateTeamProfileInputSchema = v.object({
  avatarUrl: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(2048)))),
  cityOrProvince: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(255)))),
  coverImageUrl: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(2048)))),
  description: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(2000)))),
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120))),
  schoolOrOrganization: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(255)))),
  teamId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export type UpdateTeamProfileInput = v.InferOutput<typeof updateTeamProfileInputSchema>;

export const listPublicTeamsInputSchema = v.object({
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20),
  page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
  search: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200))),
});

export type ListPublicTeamsInput = v.InferOutput<typeof listPublicTeamsInputSchema>;

export const getPublicTeamInputSchema = v.object({
  teamNumber: v.pipe(v.string(), v.trim(), v.regex(TEAM_NUMBER_PATTERN)),
});

export type GetPublicTeamInput = v.InferOutput<typeof getPublicTeamInputSchema>;

export const inviteTeamMemberInputSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(320)),
  role: v.picklist(["TEAM_LEADER", "TEAM_MEMBER"]),
  teamId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export type InviteTeamMemberInput = v.InferOutput<typeof inviteTeamMemberInputSchema>;

export const listTeamInvitationsInputSchema = v.object({
  teamId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export type ListTeamInvitationsInput = v.InferOutput<typeof listTeamInvitationsInputSchema>;

export const revokeTeamInvitationInputSchema = v.object({
  invitationId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export type RevokeTeamInvitationInput = v.InferOutput<typeof revokeTeamInvitationInputSchema>;

export const listTeamMembersInputSchema = v.object({
  teamId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export type ListTeamMembersInput = v.InferOutput<typeof listTeamMembersInputSchema>;

export const removeTeamMemberInputSchema = v.object({
  membershipId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export type RemoveTeamMemberInput = v.InferOutput<typeof removeTeamMemberInputSchema>;
