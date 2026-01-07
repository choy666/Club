import { z } from "zod";

import { dueIdSchema } from "./enrollments";

const isoDateSchema = z
  .string()
  .datetime({ message: "La fecha debe estar en formato ISO." })
  .optional();

export const createPaymentSchema = dueIdSchema.extend({
  amount: z.coerce.number().int().positive("El monto debe ser mayor a cero.").optional(),
  paidAt: isoDateSchema,
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
