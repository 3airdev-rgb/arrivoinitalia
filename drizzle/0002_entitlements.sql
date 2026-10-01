CREATE TABLE `entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product` text NOT NULL,
	`starts` integer NOT NULL,
	`expires` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text NOT NULL,
	`reference` text,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `entitlements_user` ON `entitlements` (`user_id`,`product`);--> statement-breakpoint
ALTER TABLE `invites` ADD `grants` text;