CREATE TABLE IF NOT EXISTS `system_settings` (
  `name` VARCHAR(64) NOT NULL PRIMARY KEY,
  `value` TEXT NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
