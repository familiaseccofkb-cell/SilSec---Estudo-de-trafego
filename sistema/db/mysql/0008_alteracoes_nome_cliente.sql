ALTER TABLE `project_changes` ADD COLUMN `previous_name` VARCHAR(255) NULL;
--> statement-breakpoint
ALTER TABLE `project_changes` ADD COLUMN `previous_client_id` VARCHAR(64) NULL;
