CREATE TABLE `sales_page_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`content` text NOT NULL,
	`author_id` text,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE INDEX `sales_page_versions_status` ON `sales_page_versions` (`status`,`updated`);--> statement-breakpoint
CREATE TABLE `site_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`created` integer NOT NULL
);
