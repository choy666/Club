CREATE TABLE "economic_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"currency_code" text DEFAULT 'ARS' NOT NULL,
	"default_monthly_amount" integer NOT NULL,
	"default_months_to_generate" integer DEFAULT 12 NOT NULL,
	"due_day" integer DEFAULT 10 NOT NULL,
	"late_fee_percentage" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "economic_configs_slug_idx" ON "economic_configs" USING btree ("slug");