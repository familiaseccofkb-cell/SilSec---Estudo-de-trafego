CREATE TABLE IF NOT EXISTS `inspection_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`source` text NOT NULL,
	`schema_json` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
CREATE TABLE IF NOT EXISTS `inspections` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`template_name` text NOT NULL,
	`schema_json` text NOT NULL,
	`title` text NOT NULL,
	`building` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`answers_json` text NOT NULL,
	`owner_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`owner_name` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `inspection_owner` ON `inspections` (`owner_id`,`updated_at`);
