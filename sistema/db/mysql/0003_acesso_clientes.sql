-- Chaves de acesso enviadas a clientes e pagamentos da anuidade (Mercado Pago)

CREATE TABLE IF NOT EXISTS `access_keys` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `code_hash` VARCHAR(128) NOT NULL,
  `code_hint` VARCHAR(16) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `client_name` VARCHAR(200) NOT NULL,
  `company` VARCHAR(200) NOT NULL DEFAULT '',
  `contract_ref` VARCHAR(120) NOT NULL DEFAULT '',
  `module` VARCHAR(32) NOT NULL DEFAULT 'advanced',
  `trial_days` INT NOT NULL DEFAULT 30,
  `expires_at` VARCHAR(40) NOT NULL,
  `revoked` INT NOT NULL DEFAULT 0,
  `redeemed_at` VARCHAR(40) NULL,
  `member_id` VARCHAR(64) NULL,
  `email_sent_at` VARCHAR(40) NULL,
  `created_by` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  UNIQUE KEY `access_key_code` (`code_hash`),
  KEY `access_key_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `member_id` VARCHAR(64) NOT NULL,
  `module` VARCHAR(32) NOT NULL,
  `amount_cents` INT NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `provider` VARCHAR(32) NOT NULL DEFAULT 'mercadopago',
  `preference_id` VARCHAR(128) NULL,
  `provider_payment_id` VARCHAR(64) NULL,
  `provider_status` VARCHAR(64) NULL,
  `grant_id` VARCHAR(128) NULL,
  `access_until` VARCHAR(40) NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  `paid_at` VARCHAR(40) NULL,
  KEY `payment_member` (`member_id`),
  UNIQUE KEY `payment_provider_id` (`provider_payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `phone` VARCHAR(40) NOT NULL DEFAULT '',
  `company` VARCHAR(200) NOT NULL DEFAULT '',
  `subject` VARCHAR(80) NOT NULL DEFAULT '',
  `message` TEXT NOT NULL,
  `ip` VARCHAR(64) NOT NULL DEFAULT '',
  `created_at` VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `access_reminders` (
  `grant_id` VARCHAR(128) NOT NULL,
  `kind` VARCHAR(16) NOT NULL,
  `sent_at` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`grant_id`, `kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
