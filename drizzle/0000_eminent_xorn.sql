CREATE TABLE `congregations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`address` text,
	`is_headquarters` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`congregation_id` integer NOT NULL,
	`name` text NOT NULL,
	`cpf` text,
	`rg` text,
	`birth_date` text NOT NULL,
	`age` integer,
	`sex` text NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`address` text,
	`cep` text,
	`neighborhood` text,
	`city` text,
	`state` text,
	`position` text NOT NULL,
	`baptism_date` text,
	`member_since` text,
	`photo_url` text,
	`status` text DEFAULT 'ativo' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_cpf_unique` ON `members` (`cpf`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_name` text NOT NULL,
	`acronym` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`address` text,
	`city` text,
	`state` text,
	`language` text DEFAULT 'pt-BR',
	`currency` text DEFAULT 'BRL',
	`email_notifications` integer DEFAULT true,
	`sms_notifications` integer DEFAULT false,
	`push_notifications` integer DEFAULT true,
	`birthday_reminders` integer DEFAULT true,
	`event_reminders` integer DEFAULT true,
	`financial_reports` integer DEFAULT true,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`congregation_id` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);