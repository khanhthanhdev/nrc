CREATE INDEX "user_email_lower_active_idx" ON "user" USING btree (lower("email")) WHERE "user"."deleted_at" IS NULL;
