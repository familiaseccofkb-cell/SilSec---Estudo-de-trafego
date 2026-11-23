-- Senha temporária com troca obrigatória no primeiro acesso (TES 1.0.3 / SilSec 19r).
ALTER TABLE `auth_users` ADD COLUMN `must_change_password` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `auth_users` ADD COLUMN `temp_password_expires_at` text;
