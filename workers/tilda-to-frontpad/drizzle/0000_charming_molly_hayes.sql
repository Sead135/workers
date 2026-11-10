CREATE TABLE `webhook_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payload` text NOT NULL,
	`headers` text,
	`status` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `webhook_logs_created_at_idx` ON `webhook_logs` (`created_at`);