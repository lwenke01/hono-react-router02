PRAGMA foreign_keys=OFF;--> statement-breakpoint
-- Safe-create fallback for Collections table
CREATE TABLE IF NOT EXISTS `Collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`season` text,
	`series` text,
	`edition` text,
	`release_year` integer,
	`themes` text,
	`colours` text,
	`name_friendly` text,
	`type` text,
	`image_urls` text,
	`releaseDate` text,
	`exclusive` text
);
--> statement-breakpoint
PRAGMA foreign_keys=ON;