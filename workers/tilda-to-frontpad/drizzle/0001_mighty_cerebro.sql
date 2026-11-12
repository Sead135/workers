PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_webhook_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_webhook_logs`("id", "payload", "status", "created_at") SELECT "id", "payload", COALESCE("status", 'unknown'), "created_at" FROM `webhook_logs`;--> statement-breakpoint
DROP TABLE `webhook_logs`;--> statement-breakpoint
ALTER TABLE `__new_webhook_logs` RENAME TO `webhook_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `webhook_logs_created_at_idx` ON `webhook_logs` (`created_at`);