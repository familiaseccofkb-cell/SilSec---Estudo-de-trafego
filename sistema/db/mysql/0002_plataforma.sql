-- SilSec · tabelas da plataforma própria (login, sessões e arquivos)

CREATE TABLE IF NOT EXISTS `auth_users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `email` VARCHAR(320) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email_verified_at` VARCHAR(40) NULL,
  `failed_logins` INT NOT NULL DEFAULT 0,
  `locked_until` VARCHAR(40) NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  UNIQUE KEY `auth_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `auth_sessions` (
  `token_hash` VARCHAR(128) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `expires_at` VARCHAR(40) NOT NULL,
  `last_seen_at` VARCHAR(40) NOT NULL,
  `ip` VARCHAR(64) NOT NULL DEFAULT '',
  `user_agent` VARCHAR(255) NOT NULL DEFAULT '',
  KEY `auth_session_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `token_hash` VARCHAR(128) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `kind` VARCHAR(16) NOT NULL,
  `expires_at` VARCHAR(40) NOT NULL,
  `used_at` VARCHAR(40) NULL,
  `created_at` VARCHAR(40) NOT NULL,
  KEY `auth_token_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `stored_files` (
  `file_key` VARCHAR(255) NOT NULL PRIMARY KEY,
  `content_type` VARCHAR(128) NOT NULL DEFAULT 'application/octet-stream',
  `size` INT NOT NULL,
  `data` LONGBLOB NOT NULL,
  `created_at` VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
