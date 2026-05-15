CREATE TABLE `Designs` (
	`id` integer PRIMARY KEY NOT NULL,
	`collection_id` integer NOT NULL,
	`shape_id` integer,
	`name` text NOT NULL,
	`description` text,
	`image_urls` text,
	`price` real,
	`release_year` integer,
	`categories` text,
	FOREIGN KEY (`collection_id`) REFERENCES `Collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shape_id`) REFERENCES `Shapes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `Shapes` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`measurements` text,
	`category` text,
	`name_friendly` text,
	`size` text,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Shapes_name_unique` ON `Shapes` (`name`);