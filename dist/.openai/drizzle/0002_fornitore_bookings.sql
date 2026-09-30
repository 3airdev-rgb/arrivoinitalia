CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`start` text NOT NULL,
	`duration` integer NOT NULL,
	`price` real NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`payment_status` text NOT NULL,
	`message` text NOT NULL,
	`meeting_url` text,
	`response_token` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
	FOREIGN KEY (`provider_id`) REFERENCES `records`(`id`)
);
--> statement-breakpoint
CREATE INDEX `bookings_user` ON `bookings` (`user_id`,`start`);
--> statement-breakpoint
CREATE INDEX `bookings_provider` ON `bookings` (`provider_id`,`start`);
