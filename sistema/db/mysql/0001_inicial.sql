-- SilSec · esquema MySQL/MariaDB (equivalente às migrações SQLite 0000–0003)
-- Colunas de texto comparadas usam utf8mb4_bin para manter a mesma semântica do SQLite (comparação exata).

CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `owner_id` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  KEY `client_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `delegations` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `source_id` VARCHAR(64) NOT NULL,
  `target_id` VARCHAR(64) NOT NULL,
  `access` VARCHAR(32) NOT NULL,
  `expires_at` VARCHAR(40) NULL,
  `revoked` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(40) NOT NULL,
  KEY `delegation_target` (`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `members` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `site_user_id` VARCHAR(64) NULL,
  `email` VARCHAR(320) NOT NULL,
  `name` TEXT NOT NULL,
  `role` VARCHAR(64) NOT NULL,
  `active` INT NOT NULL DEFAULT 1,
  `is_owner` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(40) NOT NULL,
  `team` VARCHAR(255) NOT NULL DEFAULT '',
  `export_approved` INT NOT NULL DEFAULT 0,
  UNIQUE KEY `member_site_id` (`site_user_id`),
  UNIQUE KEY `member_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `profiles` (
  `owner_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `data_json` LONGTEXT NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `owner_id` VARCHAR(64) NOT NULL,
  `client_id` VARCHAR(64) NULL,
  `name` TEXT NOT NULL,
  `study_json` LONGTEXT NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `revision` INT NOT NULL DEFAULT 1,
  `calculated_revision` INT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  `calculation_snapshot` LONGTEXT NULL,
  `report_key` VARCHAR(255) NULL,
  `report_revision` INT NULL,
  KEY `project_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `shares` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `owner_id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `snapshot_json` LONGTEXT NOT NULL,
  `expires_at` VARCHAR(40) NULL,
  `revoked` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(40) NOT NULL,
  `sequence` INT NULL,
  `created_by` VARCHAR(64) NULL,
  `approved_by` VARCHAR(64) NULL,
  `approval` VARCHAR(32) NOT NULL DEFAULT 'approved',
  `scope` VARCHAR(64) NOT NULL DEFAULT 'all',
  `permission` VARCHAR(32) NOT NULL DEFAULT 'read',
  `supplier_id` VARCHAR(64) NULL,
  UNIQUE KEY `share_hash` (`token_hash`),
  KEY `share_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `audit_log` (
  `sequence` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `project_id` VARCHAR(64) NULL,
  `actor_id` VARCHAR(64) NOT NULL,
  `actor_email` VARCHAR(320) NOT NULL,
  `event` VARCHAR(128) NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  KEY `audit_project` (`project_id`),
  KEY `audit_actor` (`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(64) NOT NULL,
  `file_key` VARCHAR(255) NOT NULL,
  `name` TEXT NOT NULL,
  `mime` VARCHAR(128) NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `uploaded_by` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  KEY `invoice_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `offers` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(64) NOT NULL,
  `supplier_id` VARCHAR(64) NOT NULL,
  `company` TEXT NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `revision` INT NOT NULL DEFAULT 1,
  `base_revision` INT NOT NULL,
  `updated_by` VARCHAR(64) NOT NULL,
  `updated_email` VARCHAR(320) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  `organization_id` VARCHAR(64) NULL,
  UNIQUE KEY `offer_supplier` (`project_id`,`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `project_access` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(64) NOT NULL,
  `member_id` VARCHAR(64) NOT NULL,
  `kind` VARCHAR(32) NOT NULL,
  `company` TEXT NOT NULL,
  `access` VARCHAR(32) NOT NULL DEFAULT 'read',
  `expires_at` VARCHAR(40) NULL,
  `revoked` INT NOT NULL DEFAULT 0,
  `created_by` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `organization_id` VARCHAR(64) NULL,
  UNIQUE KEY `project_member_access` (`project_id`,`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `supplier_catalog` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `company` VARCHAR(255) NOT NULL,
  `product_key` VARCHAR(255) NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `revision` INT NOT NULL DEFAULT 1,
  `updated_by` VARCHAR(64) NOT NULL,
  `updated_email` VARCHAR(320) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  `organization_id` VARCHAR(64) NULL,
  UNIQUE KEY `supplier_product` (`company`,`product_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `acquisition_requests` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `member_id` VARCHAR(64) NOT NULL,
  `module` VARCHAR(64) NOT NULL,
  `period` VARCHAR(32) NOT NULL,
  `amount_cents` INT NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `created_at` VARCHAR(40) NOT NULL,
  `approved_at` VARCHAR(40) NULL,
  `approved_by` VARCHAR(64) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `billing_identities` (
  `member_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `cpf_hash` VARCHAR(128) NOT NULL,
  `last_four` VARCHAR(8) NOT NULL,
  `trial_started_at` VARCHAR(40) NULL,
  UNIQUE KEY `billing_cpf` (`cpf_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `education_requests` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `member_id` VARCHAR(64) NOT NULL,
  `institution` TEXT NOT NULL,
  `issued_date` VARCHAR(40) NOT NULL,
  `file_key` VARCHAR(255) NOT NULL,
  `file_hash` VARCHAR(128) NOT NULL,
  `file_name` TEXT NOT NULL,
  `mime` VARCHAR(128) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `created_at` VARCHAR(40) NOT NULL,
  `reviewed_at` VARCHAR(40) NULL,
  `reviewed_by` VARCHAR(64) NULL,
  KEY `education_member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `module_grants` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `member_id` VARCHAR(64) NOT NULL,
  `module` VARCHAR(64) NOT NULL,
  `source` VARCHAR(64) NOT NULL,
  `starts_at` VARCHAR(40) NOT NULL,
  `ends_at` VARCHAR(40) NULL,
  `revoked` INT NOT NULL DEFAULT 0,
  `token_hash` VARCHAR(128) NULL,
  `redeemed_at` VARCHAR(40) NULL,
  `created_by` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  KEY `module_grant_member` (`member_id`),
  UNIQUE KEY `license_token_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `silsec_commercial` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(64) NOT NULL,
  `supplier_id` VARCHAR(64) NOT NULL,
  `organization_id` VARCHAR(64) NULL,
  `data_json` LONGTEXT NOT NULL,
  `analysis_json` LONGTEXT NULL,
  `config_key` VARCHAR(255) NOT NULL,
  `revision` INT NOT NULL DEFAULT 1,
  `updated_by` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  UNIQUE KEY `silsec_commercial_supplier` (`project_id`,`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `silsec_documents` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(64) NOT NULL,
  `supplier_id` VARCHAR(64) NULL,
  `organization_id` VARCHAR(64) NULL,
  `category` VARCHAR(32) NOT NULL,
  `name` TEXT NOT NULL,
  `mime` VARCHAR(128) NOT NULL,
  `file_key` VARCHAR(255) NOT NULL,
  `hash` VARCHAR(128) NOT NULL,
  `uploaded_by` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  KEY `silsec_documents_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `silsec_memberships` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `organization_id` VARCHAR(64) NOT NULL,
  `member_id` VARCHAR(64) NOT NULL,
  `level` VARCHAR(32) NOT NULL,
  `permissions_json` LONGTEXT NOT NULL,
  `active` INT NOT NULL DEFAULT 1,
  UNIQUE KEY `silsec_member_org` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `silsec_organizations` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `cnpj` VARCHAR(32) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `kind` VARCHAR(32) NOT NULL,
  `fiscal_json` LONGTEXT NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  UNIQUE KEY `silsec_cnpj` (`cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `silsec_registrations` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `invitation_id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `site_user_id` VARCHAR(64) NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  UNIQUE KEY `silsec_registration` (`invitation_id`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `silsec_invitations` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(64) NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `expires_at` VARCHAR(40) NOT NULL,
  `created_by` VARCHAR(64) NOT NULL,
  `revoked` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(40) NOT NULL,
  UNIQUE KEY `silsec_invite_token` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
