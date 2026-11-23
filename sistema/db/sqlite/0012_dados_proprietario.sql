-- Dados do proprietário enviados pelo cliente convidado, aguardando revisão (TES 1.0.4 / SilSec 19r).
CREATE TABLE IF NOT EXISTS `owner_data` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`member_id` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`data_json` text NOT NULL,
	`status` text NOT NULL,
	`updated_email` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `owner_data_project_member` ON `owner_data` (`project_id`,`member_id`);
