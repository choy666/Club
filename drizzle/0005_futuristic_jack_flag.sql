ALTER TYPE "public"."member_status" ADD VALUE 'VITALICIO';--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "dues" ADD COLUMN "status_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dues" ADD COLUMN "paid_amount" integer;--> statement-breakpoint
ALTER TABLE "dues" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "dues" ADD COLUMN "payment_notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_original" text;