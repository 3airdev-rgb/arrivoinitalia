CREATE TABLE `lesson_files` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_files_lesson` ON `lesson_files` (`lesson_id`,`position`);