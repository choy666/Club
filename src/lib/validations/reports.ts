import { z } from "zod";

const isoDateRegex =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:[T\s](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\.\d+)?(?:Z|[+-][01]\d:[0-5]\d)?)?$/;

export const reportGranularityEnum = z.enum(["weekly", "monthly"]);

const isoDateString = z
  .string()
  .min(1, "La fecha es obligatoria.")
  .refine((value) => isoDateRegex.test(value), {
    message: "Fecha inválida. Usa formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ssZ).",
  })
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Fecha inválida.",
  });

export const reportFiltersSchema = z
  .object({
    dateFrom: isoDateString,
    dateTo: isoDateString,
    granularity: reportGranularityEnum,
    planId: z
      .union([z.string().uuid(), z.literal("")])
      .optional()
      .transform((value) => {
        if (!value) return undefined;
        return value;
      }),
    currency: z
      .string()
      .min(3)
      .max(3)
      .optional()
      .transform((value) => value?.toUpperCase()),
  })
  .refine(
    ({ dateFrom, dateTo }) => {
      const from = Date.parse(dateFrom);
      const to = Date.parse(dateTo);
      return from <= to;
    },
    {
      path: ["dateTo"],
      message: "La fecha final debe ser mayor o igual a la inicial.",
    }
  );

export type ReportFiltersSchema = z.infer<typeof reportFiltersSchema>;
