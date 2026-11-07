CREATE TABLE `silsec_commercial` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`organization_id` text,
	`data_json` text NOT NULL,
	`analysis_json` text,
	`config_key` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `silsec_commercial_supplier` ON `silsec_commercial` (`project_id`,`supplier_id`);--> statement-breakpoint
CREATE TABLE `silsec_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`supplier_id` text,
	`organization_id` text,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`file_key` text NOT NULL,
	`hash` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `silsec_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`member_id` text NOT NULL,
	`level` text NOT NULL,
	`permissions_json` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `silsec_member_org` ON `silsec_memberships` (`member_id`);--> statement-breakpoint
CREATE TABLE `silsec_organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`cnpj` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`fiscal_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `silsec_cnpj` ON `silsec_organizations` (`cnpj`);--> statement-breakpoint
CREATE TABLE `silsec_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`invitation_id` text NOT NULL,
	`email` text NOT NULL,
	`site_user_id` text NOT NULL,
	`data_json` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `silsec_registration` ON `silsec_registrations` (`invitation_id`,`email`);--> statement-breakpoint
CREATE TABLE `silsec_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_by` text NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `silsec_invite_token` ON `silsec_invitations` (`token_hash`);--> statement-breakpoint
ALTER TABLE `offers` ADD `organization_id` text;--> statement-breakpoint
ALTER TABLE `project_access` ADD `organization_id` text;--> statement-breakpoint
ALTER TABLE `supplier_catalog` ADD `organization_id` text;