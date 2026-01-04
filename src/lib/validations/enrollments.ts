import { z } from "zod";

const isoDateString = z.string().refine(
  (value) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  },
  { message: "La fecha no es válida." }
);

export const createEnrollmentSchema = z.object({
  memberId: z.string().uuid("El socio es inválido."),
  startDate: isoDateString,
  planName: z
    .string()
    .min(3, "El nombre del plan debe tener al menos 3 caracteres.")
    .max(80, "El nombre del plan no puede superar 80 caracteres.")
    .optional()
    .nullable(),
  monthlyAmount: z.coerce
    .number()
    .int("El monto debe ser un entero.")
    .min(0, "El monto debe ser positivo.")
    .optional(),
  monthsToGenerate: z.coerce
    .number()
    .int()
    .min(1, "Debes generar al menos una cuota.")
    .max(24, "No se pueden generar más de 24 cuotas por lote.")
    .optional(),
  notes: z.string().max(400, "Las notas no pueden superar 400 caracteres.").optional().nullable(),
});

export const enrollmentIdSchema = z.object({
  enrollmentId: z.string().uuid("Identificador inválido."),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(["ACTIVE", "CANCELLED"]),
  notes: z.string().max(400, "Las notas no pueden superar 400 caracteres.").optional().nullable(),
});

export const listEnrollmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(50).default(10),
  status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
  memberId: z.string().uuid().optional(),
  search: z.string().max(120).optional(),
});

export const listDuesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(50).default(10),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "FROZEN"]).optional(),
  memberId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  from: isoDateString.optional(),
  to: isoDateString.optional(),
});

export const dueIdSchema = z.object({
  dueId: z.string().uuid("Identificador inválido."),
});

export const payDueSchema = z.object({
  paidAt: isoDateString.optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type ListEnrollmentsInput = z.infer<typeof listEnrollmentsSchema>;
export type ListDuesInput = z.infer<typeof listDuesSchema>;
