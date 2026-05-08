export const SYNC_SCHEMA_VERSION = "2026-03-08";
export const SYNC_DEFINITION_VERSION = "2025.1";
export const SUPPORTED_SYNC_SEASON = "2025";

export const MACHINE_PUSH_RESOURCE_TYPES = [
  "inspection_schedule",
  "inspection_results",
  "match_schedule",
  "match_results",
  "team_rankings",
  "team_awards",
] as const;

export const MACHINE_PULL_RESOURCE_TYPES = [
  "season_definition",
  "event_manifest",
  "approved_registrations",
  "team_operational_profiles",
  "sync_policy",
] as const;

export const DEFAULT_ALLOWED_PUSH_RESOURCES = [...MACHINE_PUSH_RESOURCE_TYPES];

export type MachinePushResourceType = (typeof MACHINE_PUSH_RESOURCE_TYPES)[number];
export type MachinePullResourceType = (typeof MACHINE_PULL_RESOURCE_TYPES)[number];
export type SyncReviewMode = "AUTO_ACCEPT" | "MANUAL_REVIEW";
export type ScheduleOwner = "WEB" | "LOCAL_APP";
