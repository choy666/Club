import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { economicConfigs } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";

export async function getEconomicConfigBySlug(slug = "default") {
  const config = await db.query.economicConfigs.findFirst({
    where: eq(economicConfigs.slug, slug),
  });

  if (config) {
    return config;
  }

  if (slug === "default") {
    return ensureDefaultEconomicConfig(slug);
  }

  throw new AppError("Configuración económica no encontrada.", 404);
}

async function ensureDefaultEconomicConfig(slug: string) {
  const defaultValues = {
    slug,
    currencyCode: env.ECONOMIC_DEFAULT_CURRENCY_CODE,
    defaultMonthlyAmount: env.ECONOMIC_DEFAULT_MONTHLY_AMOUNT,
    dueDay: env.ECONOMIC_DEFAULT_DUE_DAY,
    lateFeePercentage: env.ECONOMIC_DEFAULT_LATE_FEE_PERCENTAGE,
    gracePeriodDays: env.ECONOMIC_DEFAULT_GRACE_PERIOD_DAYS,
  };

  const inserted = await db
    .insert(economicConfigs)
    .values(defaultValues)
    .onConflictDoNothing()
    .returning();

  if (inserted.length) {
    return inserted[0];
  }

  const fallback = await db.query.economicConfigs.findFirst({
    where: eq(economicConfigs.slug, slug),
  });

  if (!fallback) {
    throw new AppError("No se pudo crear la configuración económica por defecto.", 500);
  }

  return fallback;
}

export type EconomicConfigDTO = Awaited<ReturnType<typeof getEconomicConfigBySlug>>;
