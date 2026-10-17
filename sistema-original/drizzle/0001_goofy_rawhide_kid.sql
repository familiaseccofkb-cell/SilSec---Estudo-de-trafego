CREATE TABLE `audit_log` (
	`sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` text,
	`actor_id` text NOT NULL,
	`actor_email` text NOT NULL,
	`event` text NOT NULL,
	`data_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`file_key` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`data_json` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`company` text NOT NULL,
	`data_json` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`base_revision` integer NOT NULL,
	`updated_by` text NOT NULL,
	`updated_email` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `offer_supplier` ON `offers` (`project_id`,`supplier_id`);--> statement-breakpoint
CREATE TABLE `project_access` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`member_id` text NOT NULL,
	`kind` text NOT NULL,
	`company` text NOT NULL,
	`access` text DEFAULT 'read' NOT NULL,
	`expires_at` text,
	`revoked` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_member_access` ON `project_access` (`project_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `supplier_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`product_key` text NOT NULL,
	`data_json` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_by` text NOT NULL,
	`updated_email` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `supplier_product` ON `supplier_catalog` (`company`,`product_key`);--> statement-breakpoint
ALTER TABLE `members` ADD `team` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `export_approved` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `shares` ADD `sequence` integer;--> statement-breakpoint
ALTER TABLE `shares` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `shares` ADD `approved_by` text;--> statement-breakpoint
ALTER TABLE `shares` ADD `approval` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `shares` ADD `scope` text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `shares` ADD `permission` text DEFAULT 'read' NOT NULL;--> statement-breakpoint
ALTER TABLE `shares` ADD `supplier_id` text;