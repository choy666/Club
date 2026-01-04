import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { economicConfigs } from "@/db/schema";
import { AppError } from "@/lib/errors";

export async function getEconomicConfigBySlug(slug = "default") {
  const config = await db.query.economicConfigs.findFirst({
    where: eq(economicConfigs.slug, slug),
  });

  if (!config) {
    throw new AppError("Configuración económica no encontrada.", 404);
  }

  return config;
}

export type EconomicConfigDTO = Awaited<ReturnType<typeof getEconomicConfigBySlug>>;
