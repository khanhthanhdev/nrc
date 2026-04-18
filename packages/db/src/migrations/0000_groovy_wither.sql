CREATE TYPE "public"."feature_audit_action" AS ENUM('CREATE', 'UPDATE', 'SOFT_DELETE', 'RESTORE');--> statement-breakpoint
CREATE TYPE "public"."feature_audit_actor_type" AS ENUM('USER', 'SYSTEM', 'SYNC_CLIENT');--> statement-breakpoint
CREATE TYPE "public"."system_role" AS ENUM('USER', 'MANAGER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_preferred_locale" AS ENUM('en', 'vi');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'LOCKED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('PARTICIPANT', 'MENTOR', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'registration_open', 'registration_closed', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."registration_review_action_type" AS ENUM('submitted', 'commented', 'requested_changes', 'approved', 'denied', 'withdrawn', 'status_changed');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('draft', 'submitted', 'under_review', 'needs_revision', 'approved', 'denied', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."notification_topic" AS ENUM('TEAM_ACTIVITY', 'REGISTRATION_STATUS', 'ORGANIZER_COMMENT', 'UPCOMING_MATCH', 'EVENT_ANNOUNCEMENT');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CLIENT_CREATED', 'CLIENT_REVOKED', 'BATCH_RECEIVED', 'BATCH_VALIDATED', 'BATCH_APPLIED', 'BATCH_REJECTED', 'POLICY_UPDATED', 'DECISION_MADE');--> statement-breakpoint
CREATE TYPE "public"."sync_audit_actor_type" AS ENUM('human', 'machine', 'system');--> statement-breakpoint
CREATE TYPE "public"."machine_push_resource_type" AS ENUM('inspection_schedule', 'inspection_results', 'match_schedule', 'match_results', 'team_rankings', 'team_awards');--> statement-breakpoint
CREATE TYPE "public"."match_phase" AS ENUM('PRACTICE', 'QUALIFICATION', 'PLAYOFF');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."schedule_owner" AS ENUM('WEB', 'LOCAL_APP');--> statement-breakpoint
CREATE TYPE "public"."sync_staged_operation" AS ENUM('upsert', 'delete', 'replace_snapshot');--> statement-breakpoint
CREATE TYPE "public"."sync_batch_status" AS ENUM('validated', 'applied', 'pending_review', 'duplicate', 'rejected', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sync_mode" AS ENUM('upsert', 'replace_snapshot');--> statement-breakpoint
CREATE TYPE "public"."sync_review_mode" AS ENUM('AUTO_ACCEPT', 'MANUAL_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."team_invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."team_membership_role" AS ENUM('TEAM_MENTOR', 'TEAM_LEADER', 'TEAM_MEMBER');--> statement-breakpoint
CREATE TABLE "feature_audit_log" (
	"action" "feature_audit_action" NOT NULL,
	"actor_label" text,
	"actor_type" "feature_audit_actor_type" DEFAULT 'USER' NOT NULL,
	"actor_user_id" text,
	"after_snapshot" jsonb,
	"before_snapshot" jsonb,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"request_id" text
);
--> statement-breakpoint
CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "staff_role_assignment_log" (
	"actor_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"new_system_role" "system_role" NOT NULL,
	"old_system_role" "system_role",
	"reason" text,
	"target_user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"address" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"date_of_birth" date DEFAULT '1970-01-01' NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"locked_at" timestamp,
	"locked_by_user_id" text,
	"locked_reason" text,
	"name" text NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"organization_or_school" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"preferred_locale" "user_preferred_locale" DEFAULT 'en' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"system_role" "system_role" DEFAULT 'USER' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_type" "user_type" DEFAULT 'PARTICIPANT' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_type_system_role_consistency_check" CHECK (("user"."user_type" = 'STAFF' AND "user"."system_role" IN ('ADMIN', 'MANAGER'))
      OR ("user"."user_type" IN ('PARTICIPANT', 'MENTOR') AND "user"."system_role" = 'USER'))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_announcement" (
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_document" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"kind" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registration_form_version" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"definition" jsonb NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"description" text,
	"event_code" varchar(50) NOT NULL,
	"event_ends_at" timestamp NOT NULL,
	"event_key" varchar(100) NOT NULL,
	"event_starts_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"location" text,
	"max_participants" integer,
	"name" text NOT NULL,
	"registration_ends_at" timestamp,
	"registration_starts_at" timestamp,
	"season" varchar(10) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"summary" text,
	"timezone" text DEFAULT 'UTC',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"venue" text
);
--> statement-breakpoint
CREATE TABLE "event_team_profile" (
	"contact_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"pit_label" text,
	"special_requirements" text,
	"team_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_event_scope" (
	"assigned_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"permission_set" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_review_action" (
	"action_type" "registration_review_action_type" NOT NULL,
	"actor_user_id" text,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"is_visible_to_team" boolean DEFAULT true NOT NULL,
	"next_status" "registration_status",
	"previous_status" "registration_status",
	"registration_id" text NOT NULL,
	"revision_id" text
);
--> statement-breakpoint
CREATE TABLE "registration_revision" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"registration_id" text NOT NULL,
	"revision_number" integer NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"submitted_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "registration" (
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"current_revision_number" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"denied_at" timestamp,
	"event_id" text NOT NULL,
	"form_version_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"reviewed_at" timestamp,
	"status" "registration_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"team_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "season_announcement" (
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"season_year" varchar(4) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_document" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"season_year" varchar(4) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"description" text,
	"game_code" varchar(50) NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"theme" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"year" varchar(4) NOT NULL,
	CONSTRAINT "season_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"actor_user_id" text,
	"body_i18n" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"team_id" text,
	"title_i18n" jsonb NOT NULL,
	"topic" "notification_topic" NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_delivery" (
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"delivered_at" timestamp,
	"id" text PRIMARY KEY NOT NULL,
	"last_error" text,
	"notification_id" text NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'PENDING' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_subscription" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"team_id" text,
	"topic" "notification_topic" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_award" (
	"award_key" text NOT NULL,
	"award_name" text NOT NULL,
	"comment" text,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_key" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb,
	"recipient_name" text,
	"source_change_set_id" text,
	"team_number" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_inspection" (
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_key" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"inspection_type" text NOT NULL,
	"payload" jsonb,
	"schedule_at" timestamp,
	"source_change_set_id" text,
	"status" text NOT NULL,
	"team_number" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_match" (
	"blue_alliance" jsonb,
	"blue_score" integer,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"details" jsonb,
	"event_key" text NOT NULL,
	"field" text,
	"id" text PRIMARY KEY NOT NULL,
	"match_key" text NOT NULL,
	"phase" "match_phase" NOT NULL,
	"played_at" timestamp,
	"red_alliance" jsonb,
	"red_score" integer,
	"result_status" text,
	"scheduled_start_at" timestamp,
	"source_change_set_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_ranking" (
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"details" jsonb,
	"event_key" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"rank" integer NOT NULL,
	"source_change_set_id" text,
	"summary" jsonb,
	"team_number" text NOT NULL,
	"ties" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_audit_log" (
	"action" "audit_action" NOT NULL,
	"actor_id" text,
	"actor_type" "sync_audit_actor_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_key" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"metadata" jsonb,
	"push_batch_id" text,
	"request_id" text,
	"sync_client_id" text
);
--> statement-breakpoint
CREATE TABLE "sync_change_set" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_key" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"published_at" timestamp,
	"push_batch_id" text NOT NULL,
	"status" "sync_batch_status" DEFAULT 'pending_review' NOT NULL,
	"summary" jsonb
);
--> statement-breakpoint
CREATE TABLE "sync_client" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_key" text NOT NULL,
	"expires_at" timestamp,
	"id" text PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"last_used_at" timestamp,
	"name" text NOT NULL,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_client_secret" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"expires_at" timestamp,
	"id" text PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	"secret_hash" text NOT NULL,
	"sync_client_id" text NOT NULL,
	"token_prefix" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_event_policy" (
	"allowed_push_resources" jsonb NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_key" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_sync_enabled" boolean DEFAULT false NOT NULL,
	"review_mode" "sync_review_mode" DEFAULT 'AUTO_ACCEPT' NOT NULL,
	"schedule_owner" "schedule_owner" DEFAULT 'WEB' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_push_batch" (
	"batch_id" text NOT NULL,
	"definition_version" text NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_key" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"payload_hash" text NOT NULL,
	"raw_payload" jsonb,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"review_reason" text,
	"reviewed_at" timestamp,
	"reviewer_id" text,
	"schema_version" text NOT NULL,
	"source" jsonb,
	"status" "sync_batch_status" DEFAULT 'validated' NOT NULL,
	"sync_client_id" text NOT NULL,
	"warnings" jsonb
);
--> statement-breakpoint
CREATE TABLE "sync_push_resource" (
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"mode" "sync_mode" NOT NULL,
	"push_batch_id" text NOT NULL,
	"record_count" integer NOT NULL,
	"resource_type" "machine_push_resource_type" NOT NULL,
	"schema_ref" text
);
--> statement-breakpoint
CREATE TABLE "sync_review_decision" (
	"change_set_id" text NOT NULL,
	"decision" "review_decision" NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"reason" text,
	"reviewed_at" timestamp DEFAULT now() NOT NULL,
	"reviewer_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_staged_item" (
	"change_set_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"event_key" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"operation" "sync_staged_operation" NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp,
	"record_key" text NOT NULL,
	"resource_type" "machine_push_resource_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"avatar_url" text,
	"city_or_province" text,
	"cover_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"description" text,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"school_or_organization" text,
	"team_number" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_invitation" (
	"accepted_at" timestamp,
	"accepted_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"invited_by_user_id" text,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"role" "team_membership_role" NOT NULL,
	"status" "team_invitation_status" DEFAULT 'PENDING' NOT NULL,
	"team_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_membership" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"invited_by_user_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"role" "team_membership_role" NOT NULL,
	"team_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploaded_files" (
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_user_id" text,
	"file_name" text NOT NULL,
	"file_size" text NOT NULL,
	"file_type" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata" jsonb,
	"s3_key" text NOT NULL,
	"s3_url" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feature_audit_log" ADD CONSTRAINT "feature_audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_assignment_log" ADD CONSTRAINT "staff_role_assignment_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_assignment_log" ADD CONSTRAINT "staff_role_assignment_log_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_assignment_log" ADD CONSTRAINT "staff_role_assignment_log_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_announcement" ADD CONSTRAINT "event_announcement_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_announcement" ADD CONSTRAINT "event_announcement_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_document" ADD CONSTRAINT "event_document_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_document" ADD CONSTRAINT "event_document_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_form_version" ADD CONSTRAINT "event_registration_form_version_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_form_version" ADD CONSTRAINT "event_registration_form_version_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registration_form_version" ADD CONSTRAINT "event_registration_form_version_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_team_profile" ADD CONSTRAINT "event_team_profile_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_team_profile" ADD CONSTRAINT "event_team_profile_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_team_profile" ADD CONSTRAINT "event_team_profile_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_event_scope" ADD CONSTRAINT "manager_event_scope_assigned_by_user_id_user_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_event_scope" ADD CONSTRAINT "manager_event_scope_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_event_scope" ADD CONSTRAINT "manager_event_scope_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_event_scope" ADD CONSTRAINT "manager_event_scope_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_review_action" ADD CONSTRAINT "registration_review_action_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_review_action" ADD CONSTRAINT "registration_review_action_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_review_action" ADD CONSTRAINT "registration_review_action_registration_id_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_review_action" ADD CONSTRAINT "registration_review_action_revision_id_registration_revision_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."registration_revision"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_revision" ADD CONSTRAINT "registration_revision_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_revision" ADD CONSTRAINT "registration_revision_registration_id_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_revision" ADD CONSTRAINT "registration_revision_submitted_by_user_id_user_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_form_version_id_event_registration_form_version_id_fk" FOREIGN KEY ("form_version_id") REFERENCES "public"."event_registration_form_version"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_announcement" ADD CONSTRAINT "season_announcement_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_announcement" ADD CONSTRAINT "season_announcement_season_year_season_year_fk" FOREIGN KEY ("season_year") REFERENCES "public"."season"("year") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_document" ADD CONSTRAINT "season_document_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_document" ADD CONSTRAINT "season_document_season_year_season_year_fk" FOREIGN KEY ("season_year") REFERENCES "public"."season"("year") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_subscription" ADD CONSTRAINT "notification_subscription_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_subscription" ADD CONSTRAINT "notification_subscription_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_subscription" ADD CONSTRAINT "notification_subscription_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_subscription" ADD CONSTRAINT "notification_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_award" ADD CONSTRAINT "published_award_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_award" ADD CONSTRAINT "published_award_source_change_set_id_sync_change_set_id_fk" FOREIGN KEY ("source_change_set_id") REFERENCES "public"."sync_change_set"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_inspection" ADD CONSTRAINT "published_inspection_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_inspection" ADD CONSTRAINT "published_inspection_source_change_set_id_sync_change_set_id_fk" FOREIGN KEY ("source_change_set_id") REFERENCES "public"."sync_change_set"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_match" ADD CONSTRAINT "published_match_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_match" ADD CONSTRAINT "published_match_source_change_set_id_sync_change_set_id_fk" FOREIGN KEY ("source_change_set_id") REFERENCES "public"."sync_change_set"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_ranking" ADD CONSTRAINT "published_ranking_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_ranking" ADD CONSTRAINT "published_ranking_source_change_set_id_sync_change_set_id_fk" FOREIGN KEY ("source_change_set_id") REFERENCES "public"."sync_change_set"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_audit_log" ADD CONSTRAINT "sync_audit_log_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_audit_log" ADD CONSTRAINT "sync_audit_log_push_batch_id_sync_push_batch_id_fk" FOREIGN KEY ("push_batch_id") REFERENCES "public"."sync_push_batch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_audit_log" ADD CONSTRAINT "sync_audit_log_sync_client_id_sync_client_id_fk" FOREIGN KEY ("sync_client_id") REFERENCES "public"."sync_client"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_change_set" ADD CONSTRAINT "sync_change_set_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_change_set" ADD CONSTRAINT "sync_change_set_push_batch_id_sync_push_batch_id_fk" FOREIGN KEY ("push_batch_id") REFERENCES "public"."sync_push_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_client" ADD CONSTRAINT "sync_client_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_client_secret" ADD CONSTRAINT "sync_client_secret_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_client_secret" ADD CONSTRAINT "sync_client_secret_sync_client_id_sync_client_id_fk" FOREIGN KEY ("sync_client_id") REFERENCES "public"."sync_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_event_policy" ADD CONSTRAINT "sync_event_policy_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_push_batch" ADD CONSTRAINT "sync_push_batch_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_push_batch" ADD CONSTRAINT "sync_push_batch_sync_client_id_sync_client_id_fk" FOREIGN KEY ("sync_client_id") REFERENCES "public"."sync_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_push_resource" ADD CONSTRAINT "sync_push_resource_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_push_resource" ADD CONSTRAINT "sync_push_resource_push_batch_id_sync_push_batch_id_fk" FOREIGN KEY ("push_batch_id") REFERENCES "public"."sync_push_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_review_decision" ADD CONSTRAINT "sync_review_decision_change_set_id_sync_change_set_id_fk" FOREIGN KEY ("change_set_id") REFERENCES "public"."sync_change_set"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_review_decision" ADD CONSTRAINT "sync_review_decision_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_staged_item" ADD CONSTRAINT "sync_staged_item_change_set_id_sync_change_set_id_fk" FOREIGN KEY ("change_set_id") REFERENCES "public"."sync_change_set"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_staged_item" ADD CONSTRAINT "sync_staged_item_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitation" ADD CONSTRAINT "team_invitation_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitation" ADD CONSTRAINT "team_invitation_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitation" ADD CONSTRAINT "team_invitation_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitation" ADD CONSTRAINT "team_invitation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_membership" ADD CONSTRAINT "team_membership_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_membership" ADD CONSTRAINT "team_membership_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_membership" ADD CONSTRAINT "team_membership_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_membership" ADD CONSTRAINT "team_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_deleted_by_user_id_user_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feature_audit_log_entity_idx" ON "feature_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "feature_audit_log_action_idx" ON "feature_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "feature_audit_log_actor_user_id_idx" ON "feature_audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "feature_audit_log_occurred_at_idx" ON "feature_audit_log" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_role_assignment_log_actor_user_id_idx" ON "staff_role_assignment_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "staff_role_assignment_log_target_user_id_idx" ON "staff_role_assignment_log" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "staff_role_assignment_log_created_at_idx" ON "staff_role_assignment_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "staff_role_assignment_log_deleted_by_user_id_idx" ON "staff_role_assignment_log" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "staff_role_assignment_log_deleted_at_idx" ON "staff_role_assignment_log" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "user_system_role_idx" ON "user" USING btree ("system_role");--> statement-breakpoint
CREATE INDEX "user_deleted_at_idx" ON "user" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "user_deleted_by_user_id_idx" ON "user" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "user_status_idx" ON "user" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_type_idx" ON "user" USING btree ("user_type");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "event_announcement_event_id_idx" ON "event_announcement" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_announcement_published_at_idx" ON "event_announcement" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "event_announcement_deleted_by_user_id_idx" ON "event_announcement" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "event_announcement_deleted_at_idx" ON "event_announcement" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "event_document_event_id_idx" ON "event_document" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_document_sort_order_idx" ON "event_document" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "event_document_deleted_by_user_id_idx" ON "event_document" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "event_document_deleted_at_idx" ON "event_document" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "event_registration_form_version_event_id_idx" ON "event_registration_form_version" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_registration_form_version_deleted_by_user_id_idx" ON "event_registration_form_version" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "event_registration_form_version_deleted_at_idx" ON "event_registration_form_version" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_registration_form_version_event_version_unique" ON "event_registration_form_version" USING btree ("event_id","version_number") WHERE "event_registration_form_version"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "event_registration_form_version_event_published_unique" ON "event_registration_form_version" USING btree ("event_id") WHERE "event_registration_form_version"."is_published" = true AND "event_registration_form_version"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "event_key_unique" ON "event" USING btree ("event_key") WHERE "event"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "event_slug_unique" ON "event" USING btree ("slug") WHERE "event"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "event_season_event_code_unique" ON "event" USING btree ("season","event_code") WHERE "event"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "event_season_idx" ON "event" USING btree ("season");--> statement-breakpoint
CREATE INDEX "event_status_idx" ON "event" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_deleted_by_user_id_idx" ON "event" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "event_deleted_at_idx" ON "event" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "event_team_profile_event_id_idx" ON "event_team_profile" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_team_profile_deleted_by_user_id_idx" ON "event_team_profile" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "event_team_profile_deleted_at_idx" ON "event_team_profile" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_team_profile_event_team_unique" ON "event_team_profile" USING btree ("event_id","team_id") WHERE "event_team_profile"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "manager_event_scope_event_id_idx" ON "manager_event_scope" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "manager_event_scope_user_id_idx" ON "manager_event_scope" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "manager_event_scope_deleted_by_user_id_idx" ON "manager_event_scope" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "manager_event_scope_deleted_at_idx" ON "manager_event_scope" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "manager_event_scope_event_user_active_unique" ON "manager_event_scope" USING btree ("event_id","user_id") WHERE "manager_event_scope"."is_active" = true AND "manager_event_scope"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "registration_review_action_registration_id_idx" ON "registration_review_action" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "registration_review_action_created_at_idx" ON "registration_review_action" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "registration_review_action_deleted_by_user_id_idx" ON "registration_review_action" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "registration_review_action_deleted_at_idx" ON "registration_review_action" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "registration_revision_registration_id_idx" ON "registration_revision" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "registration_revision_submitted_at_idx" ON "registration_revision" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "registration_revision_deleted_by_user_id_idx" ON "registration_revision" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "registration_revision_deleted_at_idx" ON "registration_revision" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_revision_registration_revision_unique" ON "registration_revision" USING btree ("registration_id","revision_number") WHERE "registration_revision"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "registration_event_id_idx" ON "registration" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "registration_team_id_idx" ON "registration" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "registration_status_idx" ON "registration" USING btree ("status");--> statement-breakpoint
CREATE INDEX "registration_deleted_by_user_id_idx" ON "registration" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "registration_deleted_at_idx" ON "registration" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_event_team_unique" ON "registration" USING btree ("event_id","team_id") WHERE "registration"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "season_announcement_season_year_idx" ON "season_announcement" USING btree ("season_year");--> statement-breakpoint
CREATE INDEX "season_announcement_published_at_idx" ON "season_announcement" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "season_announcement_sort_order_idx" ON "season_announcement" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "season_announcement_deleted_by_user_id_idx" ON "season_announcement" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "season_announcement_deleted_at_idx" ON "season_announcement" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "season_document_season_year_idx" ON "season_document" USING btree ("season_year");--> statement-breakpoint
CREATE INDEX "season_document_sort_order_idx" ON "season_document" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "season_document_deleted_by_user_id_idx" ON "season_document" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "season_document_deleted_at_idx" ON "season_document" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "season_is_active_idx" ON "season" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "season_deleted_by_user_id_idx" ON "season" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "season_deleted_at_idx" ON "season" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "season_year_active_unique" ON "season" USING btree ("year") WHERE "season"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "notification_topic_idx" ON "notification" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_deleted_by_user_id_idx" ON "notification" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "notification_deleted_at_idx" ON "notification" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "notification_delivery_notification_id_idx" ON "notification_delivery" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_delivery_user_id_idx" ON "notification_delivery" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_delivery_status_idx" ON "notification_delivery" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_delivery_deleted_by_user_id_idx" ON "notification_delivery" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "notification_delivery_deleted_at_idx" ON "notification_delivery" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_delivery_unique" ON "notification_delivery" USING btree ("notification_id","user_id","channel") WHERE "notification_delivery"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "notification_subscription_user_id_idx" ON "notification_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_subscription_topic_idx" ON "notification_subscription" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "notification_subscription_deleted_by_user_id_idx" ON "notification_subscription" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "notification_subscription_deleted_at_idx" ON "notification_subscription" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_subscription_scope_unique" ON "notification_subscription" USING btree ("user_id","topic","event_id","team_id") WHERE "notification_subscription"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "published_award_event_key_idx" ON "published_award" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "published_award_deleted_by_user_id_idx" ON "published_award" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "published_award_deleted_at_idx" ON "published_award" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "published_award_event_award_key_unique" ON "published_award" USING btree ("event_key","award_key") WHERE "published_award"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "published_inspection_event_key_idx" ON "published_inspection" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "published_inspection_deleted_by_user_id_idx" ON "published_inspection" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "published_inspection_deleted_at_idx" ON "published_inspection" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "published_inspection_event_team_type_unique" ON "published_inspection" USING btree ("event_key","team_number","inspection_type") WHERE "published_inspection"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "published_match_event_key_idx" ON "published_match" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "published_match_phase_idx" ON "published_match" USING btree ("phase");--> statement-breakpoint
CREATE INDEX "published_match_deleted_by_user_id_idx" ON "published_match" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "published_match_deleted_at_idx" ON "published_match" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "published_match_event_match_key_unique" ON "published_match" USING btree ("event_key","match_key") WHERE "published_match"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "published_ranking_event_key_idx" ON "published_ranking" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "published_ranking_deleted_by_user_id_idx" ON "published_ranking" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "published_ranking_deleted_at_idx" ON "published_ranking" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "published_ranking_event_team_unique" ON "published_ranking" USING btree ("event_key","team_number") WHERE "published_ranking"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "sync_audit_log_event_key_idx" ON "sync_audit_log" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "sync_audit_log_action_idx" ON "sync_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "sync_audit_log_created_at_idx" ON "sync_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sync_audit_log_deleted_by_user_id_idx" ON "sync_audit_log" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "sync_audit_log_deleted_at_idx" ON "sync_audit_log" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "sync_change_set_event_key_idx" ON "sync_change_set" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "sync_change_set_status_idx" ON "sync_change_set" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_change_set_deleted_by_user_id_idx" ON "sync_change_set" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "sync_change_set_deleted_at_idx" ON "sync_change_set" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_change_set_push_batch_unique" ON "sync_change_set" USING btree ("push_batch_id") WHERE "sync_change_set"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "sync_client_event_key_idx" ON "sync_client" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "sync_client_is_active_idx" ON "sync_client" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sync_client_is_revoked_idx" ON "sync_client" USING btree ("is_revoked");--> statement-breakpoint
CREATE INDEX "sync_client_deleted_by_user_id_idx" ON "sync_client" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "sync_client_deleted_at_idx" ON "sync_client" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_client_event_key_active_unique" ON "sync_client" USING btree ("event_key") WHERE "sync_client"."is_active" = true AND "sync_client"."is_revoked" = false AND "sync_client"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "sync_client_secret_sync_client_id_idx" ON "sync_client_secret" USING btree ("sync_client_id");--> statement-breakpoint
CREATE INDEX "sync_client_secret_is_active_idx" ON "sync_client_secret" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sync_client_secret_deleted_by_user_id_idx" ON "sync_client_secret" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "sync_client_secret_deleted_at_idx" ON "sync_client_secret" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_client_secret_token_prefix_unique" ON "sync_client_secret" USING btree ("token_prefix") WHERE "sync_client_secret"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "sync_event_policy_deleted_by_user_id_idx" ON "sync_event_policy" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "sync_event_policy_deleted_at_idx" ON "sync_event_policy" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_event_policy_event_key_unique" ON "sync_event_policy" USING btree ("event_key") WHERE "sync_event_policy"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "sync_push_batch_sync_client_id_idx" ON "sync_push_batch" USING btree ("sync_client_id");--> statement-breakpoint
CREATE INDEX "sync_push_batch_event_key_idx" ON "sync_push_batch" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "sync_push_batch_status_idx" ON "sync_push_batch" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_push_batch_deleted_by_user_id_idx" ON "sync_push_batch" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "sync_push_batch_deleted_at_idx" ON "sync_push_batch" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_push_batch_client_batch_unique" ON "sync_push_batch" USING btree ("sync_client_id","batch_id") WHERE "sync_push_batch"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "sync_push_resource_push_batch_id_idx" ON "sync_push_resource" USING btree ("push_batch_id");--> statement-breakpoint
CREATE INDEX "sync_push_resource_resource_type_idx" ON "sync_push_resource" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "sync_push_resource_deleted_by_user_id_idx" ON "sync_push_resource" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "sync_push_resource_deleted_at_idx" ON "sync_push_resource" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "sync_review_decision_change_set_id_idx" ON "sync_review_decision" USING btree ("change_set_id");--> statement-breakpoint
CREATE INDEX "sync_review_decision_deleted_by_user_id_idx" ON "sync_review_decision" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "sync_review_decision_deleted_at_idx" ON "sync_review_decision" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "sync_staged_item_change_set_id_idx" ON "sync_staged_item" USING btree ("change_set_id");--> statement-breakpoint
CREATE INDEX "sync_staged_item_event_key_idx" ON "sync_staged_item" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "sync_staged_item_resource_type_idx" ON "sync_staged_item" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "sync_staged_item_deleted_by_user_id_idx" ON "sync_staged_item" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "sync_staged_item_deleted_at_idx" ON "sync_staged_item" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_staged_item_change_resource_record_unique" ON "sync_staged_item" USING btree ("change_set_id","resource_type","record_key") WHERE "sync_staged_item"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "team_organization_id_unique" ON "team" USING btree ("organization_id") WHERE "team"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "team_team_number_unique" ON "team" USING btree ("team_number") WHERE "team"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "team_created_by_user_id_idx" ON "team" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "team_deleted_by_user_id_idx" ON "team" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "team_deleted_at_idx" ON "team" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "team_invitation_team_id_idx" ON "team_invitation" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_invitation_email_idx" ON "team_invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "team_invitation_status_idx" ON "team_invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "team_invitation_deleted_by_user_id_idx" ON "team_invitation" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "team_invitation_deleted_at_idx" ON "team_invitation" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invitation_team_email_pending_unique" ON "team_invitation" USING btree ("team_id","email") WHERE "team_invitation"."status" = 'PENDING' AND "team_invitation"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "team_membership_team_id_idx" ON "team_membership" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_membership_user_id_idx" ON "team_membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_membership_role_idx" ON "team_membership" USING btree ("role");--> statement-breakpoint
CREATE INDEX "team_membership_deleted_by_user_id_idx" ON "team_membership" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "team_membership_deleted_at_idx" ON "team_membership" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "team_membership_team_user_active_unique" ON "team_membership" USING btree ("team_id","user_id") WHERE "team_membership"."is_active" = true AND "team_membership"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "team_membership_user_non_mentor_active_unique" ON "team_membership" USING btree ("user_id") WHERE "team_membership"."is_active" = true AND "team_membership"."role" IN ('TEAM_LEADER', 'TEAM_MEMBER') AND "team_membership"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_uploaded_files_user_id" ON "uploaded_files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_uploaded_files_category" ON "uploaded_files" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_uploaded_files_s3_key" ON "uploaded_files" USING btree ("s3_key");--> statement-breakpoint
CREATE INDEX "idx_uploaded_files_created_at" ON "uploaded_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_uploaded_files_deleted_by_user_id" ON "uploaded_files" USING btree ("deleted_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_uploaded_files_deleted_at" ON "uploaded_files" USING btree ("deleted_at");