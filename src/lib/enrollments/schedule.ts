import { dues } from "@/db/schema";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type BuildDueScheduleInput = {
  enrollmentId: string;
  memberId: string;
  startDate: Date | string;
  monthsToGenerate: number;
  monthlyAmount: number;
};

function toUTCDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function toDate(value: Date | string) {
  if (value instanceof Date) {
    return toUTCDate(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
  }

  if (DATE_ONLY_REGEX.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return toUTCDate(year, month - 1, day);
  }

  const parsed = new Date(value);
  return toUTCDate(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  );
}

export function addMonths(date: Date, months: number) {
  return toUTCDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    date.getUTCDate(),
  );
}

export function formatDateOnly(date: Date) {
  return date.toISOString().split("T")[0]!;
}

export function buildDueSchedule(
  input: BuildDueScheduleInput,
): (typeof dues.$inferInsert)[] {
  const baseDate = toDate(input.startDate);

  if (Number.isNaN(baseDate.getTime())) {
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
      dueDate: formatDateOnly(dueDate),
      amount: input.monthlyAmount,
    };
  });
}
