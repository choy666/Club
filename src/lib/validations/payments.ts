import { z } from "zod";

import { dueIdSchema } from "./enrollments";

const isoDateSchema = z
  .string()
  .datetime({ message: "La fecha debe estar en formato ISO." })
  .optional();

export const createPaymentSchema = dueIdSchema.extend({
  amount: z.coerce.number().int().positive("El monto debe ser mayor a cero.").optional(),
  method: z
    .string()
    .trim()
    .min(2, "El método de pago debe tener al menos 2 caracteres.")
    .max(60, "El método de pago no puede superar 60 caracteres.")
    .optional(),
  reference: z
    .string()
    .trim()
    .max(120, "La referencia no puede superar 120 caracteres.")
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(300, "Las notas no pueden superar 300 caracteres.")
    .optional()
    .nullable(),
  paidAt: isoDateSchema,
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
