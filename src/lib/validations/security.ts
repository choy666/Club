import { z } from "zod";

// Schema para validar límites de pagos masivos
export const paymentLimitsSchema = z.object({
  maxDuesPerPayment: z.number().min(1).max(50),
  maxAmountPerPayment: z.number().min(1).max(1000000),
});

// Schema para validar promoción a vitalicio
export const vitalicioPromotionSchema = z.object({
  requiredPaidDues: z.number().min(360),
  allowedStatuses: z.enum(["ACTIVE", "INACTIVE"]),
});

// Schema para validar eliminación de socios
export const memberDeletionSchema = z.object({
  allowDeletionWithPaidDues: z.boolean().default(false),
  maxPaidDuesForDeletion: z.number().default(0),
});

// Función de validación para pagos masivos
export function validateMultiplePayment(dueIds: string[]) {
  const limits = paymentLimitsSchema.parse({
    maxDuesPerPayment: 50,
    maxAmountPerPayment: 1000000,
  });

  if (dueIds.length > limits.maxDuesPerPayment) {
    throw new Error(
      `No se pueden pagar más de ${limits.maxDuesPerPayment} cuotas en una sola transacción`
    );
  }

  if (dueIds.length === 0) {
    throw new Error("Debe seleccionar al menos una cuota para pagar");
  }

  return { valid: true, limits };
}

// Función de validación para promoción a vitalicio
export function validateVitalicioPromotion(paidDuesCount: number, currentStatus: string) {
  const requirements = vitalicioPromotionSchema.parse({
    requiredPaidDues: 360,
    allowedStatuses: ["ACTIVE", "INACTIVE"],
  });

  if (paidDuesCount < requirements.requiredPaidDues) {
    return {
      eligible: false,
      reason: `Se requieren al menos ${requirements.requiredPaidDues} cuotas pagadas`,
    };
  }

  if (!requirements.allowedStatuses.includes(currentStatus as "ACTIVE" | "INACTIVE")) {
    return {
      eligible: false,
      reason: "El estado actual del socio no permite promoción a vitalicio",
    };
  }

  return { eligible: true, requirements };
}

// Función de validación para eliminación de socios
export function validateMemberDeletion(paidDuesCount: number) {
  const rules = memberDeletionSchema.parse({
    allowDeletionWithPaidDues: true, // Permitir eliminación con cuotas pagadas
    maxPaidDuesForDeletion: Infinity, // Sin límite de cuotas pagadas
  });

  // Siempre permitir eliminación, pero devolver información para advertencia
  return {
    canDelete: true,
    rules,
    hasPaidDues: paidDuesCount > 0,
    paidDuesCount,
    requiresWarning: paidDuesCount > 0,
  };
}
