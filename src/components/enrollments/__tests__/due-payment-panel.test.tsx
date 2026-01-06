import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DuePaymentPanel } from "@/components/enrollments/due-payment-panel";
import type { DueDTO } from "@/types/enrollment";

// Mock del hook de pagos
vi.mock("@/hooks/use-enrollments", () => ({
  usePayMultipleDues: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    data: null,
  }),
}));

describe("DuePaymentPanel", () => {
  let queryClient: QueryClient;
  let mockDues: DueDTO[];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockDues = [
      {
        id: "due-1",
        amount: 5000,
        dueDate: "2025-01-15",
        status: "PENDING",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        paidAt: null,
        enrollmentId: "enrollment-1",
        memberId: "member-1",
        member: {
          id: "member-1",
          name: "Juan Pérez",
          email: "juan@example.com",
          documentNumber: "12345678",
        },
        enrollment: {
          id: "enrollment-1",
          planName: "Plan Standard",
          monthlyAmount: 5000,
        },
      },
      {
        id: "due-2",
        amount: 5000,
        dueDate: "2025-02-15",
        status: "PENDING",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        paidAt: null,
        enrollmentId: "enrollment-1",
        memberId: "member-1",
        member: {
          id: "member-1",
          name: "Juan Pérez",
          email: "juan@example.com",
          documentNumber: "12345678",
        },
        enrollment: {
          id: "enrollment-1",
          planName: "Plan Standard",
          monthlyAmount: 5000,
        },
      },
    ];
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DuePaymentPanel
          memberId="member-1"
          memberName="Juan Pérez"
          dues={mockDues}
          onClose={vi.fn()}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it("muestra el título y nombre del miembro", () => {
    renderComponent();
    
    expect(screen.getByText("Pagar Cuotas")).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
  });

  it("muestra el resumen inicial con cuotas pendientes", () => {
    renderComponent();
    
    expect(screen.getByText("Cuotas seleccionadas")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Total a pagar")).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("permite seleccionar cuotas individualmente", async () => {
    renderComponent();
    
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    
    // Seleccionar primera cuota
    fireEvent.click(checkboxes[0]);
    
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("$5.000")).toBeInTheDocument();
    });
  });

  it("muestra métodos de pago disponibles", () => {
    renderComponent();
    
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("Transferencia bancaria")).toBeInTheDocument();
    expect(screen.getByText("Mercado Pago")).toBeInTheDocument();
  });

  it("deshabilita el botón de pagar cuando no hay cuotas seleccionadas", () => {
    renderComponent();
    
    const payButton = screen.getByRole("button", { name: /Pagar/ });
    expect(payButton).toBeDisabled();
  });
});
