CREATE TABLE IF NOT EXISTS `project_access_requests` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(64) NOT NULL,
  `requester_id` VARCHAR(64) NOT NULL,
  `requester_email` VARCHAR(255) NOT NULL DEFAULT '',
  `status` VARCHAR(20) NOT NULL,
  `expires_at` VARCHAR(40) NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `decided_at` VARCHAR(40) NULL,
  `decided_by` VARCHAR(64) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_changes` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(64) NOT NULL,
  `requester_id` VARCHAR(64) NOT NULL,
  `requester_email` VARCHAR(255) NOT NULL DEFAULT '',
  `request_id` VARCHAR(64) NULL,
  `status` VARCHAR(20) NOT NULL,
  `previous_study_json` LONGTEXT NOT NULL,
  `previous_status` VARCHAR(32) NOT NULL,
  `previous_snapshot_json` LONGTEXT NULL,
  `previous_calculated_revision` INT NULL,
  `previous_revision` INT NOT NULL,
  `new_revision` INT NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `decided_at` VARCHAR(40) NULL,
  `decided_by` VARCHAR(64) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
