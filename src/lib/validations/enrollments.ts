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
  enrollmentAmount: z.coerce
    .number()
    .int("El monto de inscripción debe ser un entero.")
    .min(0, "El monto debe ser positivo.")
    .optional(),
  clubName: z
    .string()
    .min(2, "El nombre del club debe tener al menos 2 caracteres.")
    .max(100, "El nombre del club no puede superar 100 caracteres.")
    .optional()
    .nullable(),
  notes: z.string().max(400, "Las notas no pueden superar 400 caracteres.").optional().nullable(),
});

export const enrollmentIdSchema = z.object({
  enrollmentId: z.string().uuid("Identificador inválido."),
});

export const bulkDeleteEnrollmentsSchema = z.object({
  enrollmentIds: z
    .array(z.string().uuid("Identificador inválido."))
    .min(1, "Enviá al menos un ID."),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "CANCELLED"]),
  notes: z.string().max(400, "Las notas no pueden superar 400 caracteres.").optional().nullable(),
});

export const listEnrollmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(50).default(10),
  status: z.enum(["PENDING", "ACTIVE", "CANCELLED"]).optional(),
  memberId: z.string().uuid().optional(),
  search: z.string().max(120).optional(),
});

export const listDuesSchema = z.object({
  search: z.string().max(120).optional(),
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

export const payDuesSchema = z.object({
  memberId: z.string().uuid(),
  dueIds: z.array(z.string().uuid()).min(1),
  paymentMethod: z.enum(["EFECTIVO", "TRANSFERENCIA", "MERCADO_PAGO"]),
  paymentNotes: z.string().optional(),
});

export const paySequentialDuesSchema = z.object({
  memberId: z.string().uuid(),
  numberOfDues: z.coerce
    .number()
    .int()
    .min(1)
    .max(60, "No se pueden pagar más de 60 cuotas en una sola operación."),
  dueAmount: z.coerce.number().min(1, "El monto de cuota debe ser mayor a 0"),
  paymentMethod: z.enum(["EFECTIVO", "TRANSFERENCIA", "MERCADO_PAGO"]),
  paymentNotes: z.string().optional(),
});

export const payDueSchema = z.object({
  paidAt: isoDateString.optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type ListEnrollmentsInput = z.infer<typeof listEnrollmentsSchema>;
export type ListDuesInput = z.infer<typeof listDuesSchema>;
export type PayDuesInput = z.infer<typeof payDuesSchema>;
export type PaySequentialDuesInput = z.infer<typeof paySequentialDuesSchema>;
