import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { logger } from "@/lib/logger";

type HealthStatus = "ok" | "degraded";

export async function GET() {
  const checks: Record<string, { status: HealthStatus; detail?: string }> = {
    database: { status: "ok" },
  };

  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    checks.database = {
      status: "degraded",
      detail: error instanceof Error ? error.message : "Error desconocido verificando DB",
    };
    logger.error(
      {
        scope: "healthcheck",
        component: "database",
        error:
          error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      },
      "Healthcheck: fallo conexión base de datos"
    );
  }

  const overall: HealthStatus = Object.values(checks).every((check) => check.status === "ok")
    ? "ok"
    : "degraded";

  const statusCode = overall === "ok" ? 200 : 503;

  if (overall === "ok") {
    logger.debug({ scope: "healthcheck" }, "Healthcheck OK");
  }

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );
}
