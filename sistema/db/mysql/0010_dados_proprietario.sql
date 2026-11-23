-- Dados do proprietário enviados pelo cliente convidado, aguardando revisão (TES 1.0.4 / SilSec 19r).
CREATE TABLE IF NOT EXISTS `owner_data` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(64) NOT NULL,
  `member_id` VARCHAR(64) NOT NULL,
  `company` VARCHAR(200) NOT NULL DEFAULT '',
  `data_json` LONGTEXT NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `updated_email` VARCHAR(320) NOT NULL DEFAULT '',
  `created_at` VARCHAR(40) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  `reviewed_by` VARCHAR(64) NULL,
  `reviewed_at` VARCHAR(40) NULL,
  UNIQUE KEY `owner_data_project_member` (`project_id`, `member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
