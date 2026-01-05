ALTER TYPE "public"."enrollment_status" ADD VALUE 'PENDING' BEFORE 'ACTIVE';--> statement-breakpoint
CREATE TABLE "monthly_run_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_dues" integer DEFAULT 0 NOT NULL,
	"operator" text DEFAULT 'manual' NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "economic_configs" DROP COLUMN "default_months_to_generate";--> statement-breakpoint
ALTER TABLE "enrollments" DROP COLUMN "months_to_generate";