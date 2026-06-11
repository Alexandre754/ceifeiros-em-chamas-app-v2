CREATE TABLE `assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`congregation_id` integer NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`subcategory` text,
	`location` text,
	`property_type` text,
	`acquisition_date` text,
	`acquisition_value` real,
	`current_value` real,
	`condition` text,
	`description` text,
	`serial_number` text,
	`photo_url` text,
	`status` text DEFAULT 'ativo' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`congregation_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`prayers_count` integer DEFAULT 0,
	`likes_count` integer DEFAULT 0,
	`comments_count` integer DEFAULT 0,
	`status` text DEFAULT 'ativo' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sermons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`congregation_id` integer NOT NULL,
	`title` text NOT NULL,
	`preacher` text NOT NULL,
	`date` text NOT NULL,
	`duration` text,
	`category` text,
	`description` text,
	`media_url` text,
	`media_type` text,
	`thumbnail_url` text,
	`views` integer DEFAULT 0,
	`downloads` integer DEFAULT 0,
	`created_by` integer,
	`status` text DEFAULT 'ativo' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`congregation_id` integer NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`description` text,
	`payment_method` text,
	`account_id` text,
	`tithe_giver_name` text,
	`created_by` integer,
	`status` text DEFAULT 'ativo' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
