CREATE INDEX `idx_par_project_status` ON `project_access_requests` (`project_id`,`status`);
--> statement-breakpoint
CREATE INDEX `idx_par_requester` ON `project_access_requests` (`requester_id`);
--> statement-breakpoint
CREATE INDEX `idx_pch_project_status` ON `project_changes` (`project_id`,`status`);
--> statement-breakpoint
CREATE INDEX `idx_pch_requester` ON `project_changes` (`requester_id`);
