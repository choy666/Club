CREATE TABLE IF NOT EXISTS "monthly_run_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_dues" integer DEFAULT 0 NOT NULL,
	"operator" text DEFAULT 'manual' NOT NULL,
	"notes" text
);
