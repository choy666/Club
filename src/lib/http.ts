import { NextResponse } from "next/server";
import { isAppError } from "./errors";

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function jsonList<T>(
  data: T[],
  meta: Record<string, unknown>,
  init?: ResponseInit,
) {
  return NextResponse.json({ data, meta }, init);
}

export function handleApiError(error: unknown) {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      {
        status: error.status,
      },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error: "Ha ocurrido un error inesperado.",
    },
    {
      status: 500,
    },
  );
}
