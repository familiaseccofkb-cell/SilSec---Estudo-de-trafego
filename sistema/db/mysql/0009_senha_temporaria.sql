-- Senha temporária com troca obrigatória no primeiro acesso (TES 1.0.3 / SilSec 19r).
ALTER TABLE `auth_users` ADD COLUMN `must_change_password` INT NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `auth_users` ADD COLUMN `temp_password_expires_at` VARCHAR(40) NULL;
