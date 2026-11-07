-- Vistorias guiadas: modelos definidos pela administração e vistorias preenchidas pelos usuários

CREATE TABLE IF NOT EXISTS `inspection_templates` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `description` VARCHAR(400) NOT NULL DEFAULT '',
  `source` MEDIUMTEXT NOT NULL,
  `schema_json` MEDIUMTEXT NOT NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  `created_by` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `inspections` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `template_id` VARCHAR(64) NOT NULL,
  `template_name` VARCHAR(200) NOT NULL,
  `schema_json` MEDIUMTEXT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `building` VARCHAR(200) NOT NULL DEFAULT '',
  `status` VARCHAR(16) NOT NULL DEFAULT 'draft',
  `answers_json` MEDIUMTEXT NOT NULL,
  `owner_id` VARCHAR(64) NOT NULL,
  `owner_email` VARCHAR(320) NOT NULL,
  `owner_name` VARCHAR(200) NOT NULL DEFAULT '',
  `created_at` VARCHAR(40) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  KEY `inspection_owner` (`owner_id`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
