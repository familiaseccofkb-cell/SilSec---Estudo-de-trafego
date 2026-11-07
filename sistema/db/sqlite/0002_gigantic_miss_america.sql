CREATE TABLE `acquisition_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`module` text NOT NULL,
	`period` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`approved_at` text,
	`approved_by` text
);
--> statement-breakpoint
CREATE TABLE `billing_identities` (
	`member_id` text PRIMARY KEY NOT NULL,
	`cpf_hash` text NOT NULL,
	`last_four` text NOT NULL,
	`trial_started_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_cpf` ON `billing_identities` (`cpf_hash`);--> statement-breakpoint
CREATE TABLE `education_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`institution` text NOT NULL,
	`issued_date` text NOT NULL,
	`file_key` text NOT NULL,
	`file_hash` text NOT NULL,
	`file_name` text NOT NULL,
	`mime` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_at` text,
	`reviewed_by` text
);
--> statement-breakpoint
CREATE INDEX `education_member` ON `education_requests` (`member_id`);--> statement-breakpoint
CREATE TABLE `module_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`module` text NOT NULL,
	`source` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text,
	`revoked` integer DEFAULT 0 NOT NULL,
	`token_hash` text,
	`redeemed_at` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `module_grant_member` ON `module_grants` (`member_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `license_token_hash` ON `module_grants` (`token_hash`);--> statement-breakpoint
ALTER TABLE `projects` ADD `calculation_snapshot` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `report_key` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `report_revision` integer;