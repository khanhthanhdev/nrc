DROP INDEX IF EXISTS "registration_event_team_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "registration_event_team_unique" ON "registration" USING btree ("event_id","team_id") WHERE "registration"."deleted_at" IS NULL AND "registration"."status" <> 'withdrawn';--> statement-breakpoint
