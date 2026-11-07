CREATE TABLE IF NOT EXISTS `project_access_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`requester_id` text NOT NULL,
	`requester_email` text NOT NULL DEFAULT '',
	`status` text NOT NULL,
	`expires_at` text,
	`created_at` text NOT NULL,
	`decided_at` text,
	`decided_by` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `project_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`requester_id` text NOT NULL,
	`requester_email` text NOT NULL DEFAULT '',
	`request_id` text,
	`status` text NOT NULL,
	`previous_study_json` text NOT NULL,
	`previous_status` text NOT NULL,
	`previous_snapshot_json` text,
	`previous_calculated_revision` integer,
	`previous_revision` integer NOT NULL,
	`new_revision` integer NOT NULL,
	`created_at` text NOT NULL,
	`decided_at` text,
	`decided_by` text
);
