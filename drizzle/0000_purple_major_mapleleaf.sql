CREATE TABLE `consultations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`body` text NOT NULL,
	`summary` text NOT NULL,
	`revision` integer NOT NULL,
	`token` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `consultations_owner_updated` ON `consultations` (`owner`,`updated`);--> statement-breakpoint
CREATE TABLE `review_events` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`owner` text NOT NULL,
	`revision` integer NOT NULL,
	`type` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `review_events_owner_case` ON `review_events` (`owner`,`case_id`);