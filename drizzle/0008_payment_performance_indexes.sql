-- Optimización de rendimiento para consultas de pagos
-- Índices compuestos para mejorar performance en operaciones secuenciales

-- Índice para consultas de cuotas pendientes por miembro y estado
CREATE INDEX IF NOT EXISTS "idx_dues_member_status_date" 
ON "dues" USING btree ("member_id", "status", "due_date");

-- Índice para consultas de pagos por miembro y fecha de creación
CREATE INDEX IF NOT EXISTS "idx_payments_member_created" 
ON "payments" USING btree ("member_id", "created_at");

-- Índice para consultas de cuotas por inscripción y estado
CREATE INDEX IF NOT EXISTS "idx_dues_enrollment_status" 
ON "dues" USING btree ("enrollment_id", "status");

-- Índice para filtrar cuotas por rango de fechas
CREATE INDEX IF NOT EXISTS "idx_dues_date_range" 
ON "dues" USING btree ("due_date", "status");

-- Índice compuesto para consultas de miembros activos
CREATE INDEX IF NOT EXISTS "idx_members_status_created" 
ON "members" USING btree ("status", "created_at");
