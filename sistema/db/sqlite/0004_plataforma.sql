CREATE TABLE IF NOT EXISTS `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`email_verified_at` text,
	`failed_logins` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `auth_user_email` ON `auth_users` (`email`);
CREATE TABLE IF NOT EXISTS `auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`ip` text DEFAULT '' NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL
);
CREATE INDEX IF NOT EXISTS `auth_session_user` ON `auth_sessions` (`user_id`);
CREATE TABLE IF NOT EXISTS `auth_tokens` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `auth_token_user` ON `auth_tokens` (`user_id`);
CREATE TABLE IF NOT EXISTS `stored_files` (
	`file_key` text PRIMARY KEY NOT NULL,
	`content_type` text DEFAULT 'application/octet-stream' NOT NULL,
	`size` integer NOT NULL,
	`data` blob NOT NULL,
	`created_at` text NOT NULL
);
