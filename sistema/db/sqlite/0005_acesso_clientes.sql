CREATE TABLE IF NOT EXISTS `access_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`code_hint` text NOT NULL,
	`email` text NOT NULL,
	`client_name` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`contract_ref` text DEFAULT '' NOT NULL,
	`module` text DEFAULT 'advanced' NOT NULL,
	`trial_days` integer DEFAULT 30 NOT NULL,
	`expires_at` text NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL,
	`redeemed_at` text,
	`member_id` text,
	`email_sent_at` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `access_key_code` ON `access_keys` (`code_hash`);
CREATE INDEX IF NOT EXISTS `access_key_email` ON `access_keys` (`email`);
CREATE TABLE IF NOT EXISTS `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`module` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider` text DEFAULT 'mercadopago' NOT NULL,
	`preference_id` text,
	`provider_payment_id` text,
	`provider_status` text,
	`grant_id` text,
	`access_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`paid_at` text
);
CREATE INDEX IF NOT EXISTS `payment_member` ON `payments` (`member_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `payment_provider_id` ON `payments` (`provider_payment_id`);
CREATE TABLE IF NOT EXISTS `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`subject` text DEFAULT '' NOT NULL,
	`message` text NOT NULL,
	`ip` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
CREATE TABLE IF NOT EXISTS `access_reminders` (
	`grant_id` text NOT NULL,
	`kind` text NOT NULL,
	`sent_at` text NOT NULL,
	PRIMARY KEY (`grant_id`, `kind`)
);
