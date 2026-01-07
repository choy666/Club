import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth-helpers";
import { handleApiError, jsonSuccess } from "@/lib/http";
import { createPaymentSchema } from "@/lib/validations/payments";
import { recordPayment } from "@/lib/enrollments/service";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = await request.json();
    const input = createPaymentSchema.parse(payload);

    const paymentResult = await recordPayment(input.dueId, input.paidAt, {
      amount: input.amount,
    });

    return jsonSuccess(paymentResult, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
