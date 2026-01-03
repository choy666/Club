INSERT INTO "economic_configs" (
  "slug",
  "currency_code",
  "default_monthly_amount",
  "default_months_to_generate",
  "due_day",
  "late_fee_percentage"
)
VALUES ('default', 'ARS', 35000, 12, 10, 0)
ON CONFLICT ("slug") DO UPDATE
SET
  "currency_code" = excluded."currency_code",
  "default_monthly_amount" = excluded."default_monthly_amount",
  "default_months_to_generate" = excluded."default_months_to_generate",
  "due_day" = excluded."due_day",
  "late_fee_percentage" = excluded."late_fee_percentage",
  "updated_at" = now();
--> statement-breakpoint
WITH qa_user AS (
  INSERT INTO "users" ("email", "name", "role", "password_hash")
  VALUES ('qa-inscripciones@club.test', 'QA Inscripciones', 'USER', NULL)
  ON CONFLICT ("email") DO UPDATE
    SET "name" = excluded."name",
        "updated_at" = now()
  RETURNING "id"
),
qa_member AS (
  INSERT INTO "members" (
    "user_id",
    "document_number",
    "phone",
    "status",
    "notes"
  )
  SELECT
    qa_user."id",
    'QA-0001',
    '+54 11 5555-0001',
    'ACTIVE',
    'Seed QA para Sprint 3'
  FROM qa_user
  ON CONFLICT ("document_number") DO UPDATE
    SET "user_id" = excluded."user_id",
        "status" = excluded."status",
        "updated_at" = now()
  RETURNING "id", "user_id"
),
qa_enrollment AS (
  INSERT INTO "enrollments" (
    "member_id",
    "start_date",
    "plan_name",
    "monthly_amount",
    "months_to_generate",
    "status",
    "notes"
  )
  SELECT
    qa_member."id",
    DATE '2025-01-05',
    'Plan QA Básico',
    35000,
    3,
    'ACTIVE',
    'Inscripción creada automáticamente para pruebas de QA.'
  FROM qa_member
  RETURNING "id", "member_id", "start_date", "monthly_amount"
)
INSERT INTO "dues" (
  "enrollment_id",
  "member_id",
  "due_date",
  "amount",
  "status",
  "paid_at"
)
SELECT
  qa_enrollment."id",
  qa_enrollment."member_id",
  (qa_enrollment."start_date" + (month_index - 1) * INTERVAL '1 month')::date,
  qa_enrollment."monthly_amount",
  CASE
    WHEN month_index = 1 THEN 'PAID'
    WHEN month_index = 2 THEN 'PENDING'
    ELSE 'OVERDUE'
  END::due_status,
  CASE
    WHEN month_index = 1 THEN qa_enrollment."start_date"
    ELSE NULL
  END
FROM qa_enrollment
CROSS JOIN generate_series(1, 3) AS month_index;
