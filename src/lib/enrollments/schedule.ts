import { dues } from "@/db/schema";
import {
  toLocalDateOnly,
  fromLocalDateOnly,
  addMonthsLocal,
  DATE_ONLY_REGEX,
} from "@/lib/utils/date-utils";

export type BuildDueScheduleInput = {
  enrollmentId: string;
  memberId: string;
  startDate: Date | string;
  monthsToGenerate: number;
  monthlyAmount: number;
};

function toDate(value: Date | string) {
  // Usar las nuevas utilidades de fecha local
  if (value instanceof Date) {
    return toLocalDateOnly(value);
  }

  if (DATE_ONLY_REGEX.test(value)) {
    return value; // Ya está en formato correcto
  }

  // Para otros formatos de string, convertir a fecha y luego a formato local
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha inválida");
  }
  return toLocalDateOnly(parsed);
}

export function addMonths(date: Date | string, months: number) {
  const baseDate = typeof date === "string" ? fromLocalDateOnly(date) : date;
  return addMonthsLocal(baseDate, months);
}

export function formatDateOnly(date: Date) {
  return toLocalDateOnly(date);
}

export function buildDueSchedule(input: BuildDueScheduleInput): (typeof dues.$inferInsert)[] {
  const baseDate = toDate(input.startDate);

  // Validar que la fecha sea válida (baseDate ahora es string)
  if (!baseDate || !DATE_ONLY_REGEX.test(baseDate)) {
    throw new Error("Fecha de inicio inválida para la generación de cuotas.");
  }

  if (input.monthsToGenerate <= 0) {
    return [];
  }

  const firstDueDate = addMonths(baseDate, 1);

  return Array.from({ length: input.monthsToGenerate }, (_, index) => {
    const dueDate = addMonths(firstDueDate, index);
    return {
      enrollmentId: input.enrollmentId,
      memberId: input.memberId,
      dueDate: toLocalDateOnly(dueDate),
      amount: input.monthlyAmount,
    };
  });
}
