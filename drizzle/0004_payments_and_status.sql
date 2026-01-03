CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"due_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"reference" text,
	"notes" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE cascade;
ALTER TABLE "payments" ADD CONSTRAINT "payments_due_id_dues_id_fk"
  FOREIGN KEY ("due_id") REFERENCES "dues"("id") ON DELETE cascade;

CREATE UNIQUE INDEX "payments_due_id_idx" ON "payments" USING btree ("due_id");
CREATE INDEX "payments_member_id_idx" ON "payments" USING btree ("member_id");
