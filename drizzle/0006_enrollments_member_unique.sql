-- Asegura unicidad de inscripciones por socio
CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_member_id_idx"
  ON "enrollments" USING btree ("member_id");
