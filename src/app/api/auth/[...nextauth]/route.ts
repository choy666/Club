import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { handlers } from "@/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

const AUTH_RATE_LIMIT = {
  limit: 10,
  windowMs: 60 * 1000,
};

function rateLimitResponse(retryAfterMs?: number) {
  return NextResponse.json(
    {
      error: "Demasiados intentos de autenticación. Probá más tarde.",
    },
    {
      status: 429,
      headers: retryAfterMs
        ? { "Retry-After": Math.ceil(retryAfterMs / 1000).toString() }
        : undefined,
    }
  );
}

const { GET, POST: originalPost } = handlers;

export { GET };

export const POST = async (request: NextRequest) => {
  const rate = enforceRateLimit(request, AUTH_RATE_LIMIT, "auth");
  if (!rate.success) {
    return rateLimitResponse(rate.retryAfterMs);
  }

  return originalPost(request);
};
