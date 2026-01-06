import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST as createPaymentHandler } from "@/app/api/pagos/route";
import { AppError } from "@/lib/errors";

const mockRecordPayment = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    user: { id: "admin-id", role: "ADMIN" },
  }),
}));

vi.mock("@/lib/enrollments/service", () => ({
  recordPayment: (...args: unknown[]) => mockRecordPayment(...args),
}));

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/pagos", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("POST /api/pagos", () => {
  beforeEach(() => {
    mockRecordPayment.mockReset();
  });

  it("registra un pago manual y devuelve due + payment", async () => {
    const payload = {
      dueId: "123e4567-e89b-12d3-a456-426614174000",
      amount: 42000,
      method: "Transferencia",
      reference: "TRX-994421",
      notes: "Pago confirmado por tesorería",
      paidAt: "2025-02-01T15:30:00.000Z",
    };

    const paymentResult = {
      due: { id: payload.dueId, status: "PAID" },
      payment: { id: "payment-1", method: payload.method },
    };

    mockRecordPayment.mockResolvedValueOnce(paymentResult);

    const response = await createPaymentHandler(buildRequest(payload));

    expect(response.status).toBe(201);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.data).toMatchObject(paymentResult);
    expect(mockRecordPayment).toHaveBeenCalledWith(payload.dueId, payload.paidAt, {
      amount: payload.amount,
      method: payload.method,
      reference: payload.reference,
      notes: payload.notes,
    });
  });

  it("devuelve 422 cuando el payload es inválido", async () => {
    const response = await createPaymentHandler(
      buildRequest({ amount: 35000, method: "Efectivo" })
    );

    expect(response.status).toBe(422);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("ValidationError");
    expect(mockRecordPayment).not.toHaveBeenCalled();
  });

  it("propaga AppError del servicio", async () => {
    mockRecordPayment.mockRejectedValueOnce(new AppError("Cuota no encontrada.", 404));

    const response = await createPaymentHandler(
      buildRequest({
        dueId: "123e4567-e89b-12d3-a456-426614174999",
      })
    );

    expect(response.status).toBe(404);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json.error).toBe("Cuota no encontrada.");
  });
});
