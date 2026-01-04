import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isAppError } from "./errors";
import { logger } from "@/lib/logger";

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function jsonList<T>(data: T[], meta: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json({ data, meta }, init);
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));
    logger.warn(
      {
        type: "validation_error",
        issues: details,
      },
      "Error de validación en endpoint"
    );
    return NextResponse.json(
      {
        error: "ValidationError",
        details,
      },
      {
        status: 422,
      }
    );
  }

  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      {
        status: error.status,
      }
    );
  }

  logger.error(
    {
      type: "unexpected_error",
      error:
        error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    },
    "Error inesperado en endpoint"
  );
  return NextResponse.json(
    {
      error: "Ha ocurrido un error inesperado.",
    },
    {
      status: 500,
    }
  );
}
