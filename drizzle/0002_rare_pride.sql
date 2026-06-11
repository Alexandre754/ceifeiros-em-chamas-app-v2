CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`congregation_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`start_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_date` text NOT NULL,
	`end_time` text NOT NULL,
	`location` text,
	`media_url` text,
	`media_type` text,
	`category` text,
	`attendance` integer,
	`created_by` integer,
	`status` text DEFAULT 'ativo' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_approvals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`requested_at` text NOT NULL,
	`approved_by` integer,
	`approved_at` text,
	`rejection_reason` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `users` ADD `approved` integer DEFAULT false;