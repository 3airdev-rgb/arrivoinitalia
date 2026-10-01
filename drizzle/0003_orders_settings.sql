CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`products` text NOT NULL,
	`amount` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`stripe_session` text,
	`stripe_payment_intent` text,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`paid_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_stripe_session_unique` ON `orders` (`stripe_session`);--> statement-breakpoint
CREATE INDEX `orders_email` ON `orders` (`email`);--> statement-breakpoint
CREATE INDEX `orders_created` ON `orders` (`created`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated` integer NOT NULL
);
