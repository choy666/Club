import { describe, it, expect } from "vitest";
import { getCredentialStatus } from "@/lib/utils/member-status-utils";
import type { MemberCredentialDTO } from "@/types/enrollment";

describe("getCredentialStatus - Validación de escenarios en tiempo real", () => {
  const mockCredential: MemberCredentialDTO = {
    member: {
      id: "test-member-id",
      name: "Test User",
      email: "test@example.com",
      documentNumber: "12345678",
      status: "ACTIVE",
    },
    enrollment: {
      id: "test-enrollment-id",
      planName: "Plan Regular",
      monthlyAmount: 35000,
      status: "ACTIVE",
      startDate: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    credential: {
      code: "TEST123",
      issuedAt: "2024-01-01",
      qrPayload: "test-payload",
    },
    isReady: true,
  };

  describe("Cobertura de primer mes (recién inscripto)", () => {
    it("debe mostrar cobertura activa si se inscribió hoy mismo", () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const newCredential: MemberCredentialDTO = {
        ...mockCredential,
        enrollment: {
          id: "test-enrollment-id",
          planName: "Plan Regular",
          monthlyAmount: 35000,
          status: "ACTIVE",
          startDate: todayStr,
          updatedAt: todayStr,
        },
      };
      
      const result = getCredentialStatus(newCredential, { paidCount: 0, totalCount: 0, percentage: 0 }, []);
      
      expect(result.label).toBe("Socio Regular Activo");
      expect(result.tone).toBe("success");
      expect(result.message).toBe("¡Bienvenido! Tu credencial está activa. Tienes cobertura por tu primer mes de inscripción.");
    });

    it("debe mostrar cobertura activa si está en el mismo mes de inscripción", () => {
      const today = new Date();
      // Usar una fecha dentro del mes actual para asegurar que esté en el mismo mes
      const enrollmentDate = new Date(today.getFullYear(), today.getMonth(), 5); // Día 5 del mes actual
      const enrollmentDateStr = enrollmentDate.toISOString().split('T')[0];
      
      const newCredential: MemberCredentialDTO = {
        ...mockCredential,
        enrollment: {
          id: "test-enrollment-id",
          planName: "Plan Regular",
          monthlyAmount: 35000,
          status: "ACTIVE",
          startDate: enrollmentDateStr,
          updatedAt: enrollmentDateStr,
        },
      };
      
      const result = getCredentialStatus(newCredential, { paidCount: 0, totalCount: 0, percentage: 0 }, []);
      
      expect(result.label).toBe("Socio Regular Activo");
      expect(result.tone).toBe("success");
      expect(result.message).toBe("¡Bienvenido! Tu credencial está activa. Tienes cobertura por tu primer mes de inscripción.");
    });
  });

  describe("Detección de cuota del mes actual pagada", () => {
    it("debe detectar cuota pagada del mes actual", () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`;
      
      const currentDues = [
        { dueDate: currentDueDate, status: "PAID" },
      ];
      
      const result = getCredentialStatus(mockCredential, { paidCount: 5, totalCount: 360, percentage: 1 }, currentDues);
      
      expect(result.label).toBe("Socio Regular Activo");
      expect(result.tone).toBe("success");
      expect(result.message).toBe("Tu credencial vitalicia está activada. Socio activo. La cuota del mes actual está pagada y en app/admin figura como activo.");
    });

    it("debe detectar cuota pendiente del mes actual", () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`;
      
      const currentDues = [
        { dueDate: currentDueDate, status: "PENDING" },
      ];
      
      const result = getCredentialStatus(mockCredential, { paidCount: 5, totalCount: 360, percentage: 1 }, currentDues);
      
      expect(result.label).toBe("Socio Regular Inactivo");
      expect(result.tone).toBe("warning");
      expect(result.message).toBe("Tu credencial está inactiva. Debe el mes actual. La cuota del mes actual está pendiente y en app/admin figura como activo.");
    });

    it("debe detectar cuando no hay cuota generada para el mes actual", () => {
      const result = getCredentialStatus(mockCredential, { paidCount: 5, totalCount: 360, percentage: 1 }, []);
      
      expect(result.label).toBe("Socio Regular Inactivo");
      expect(result.tone).toBe("warning");
      expect(result.message).toBe("Tu credencial está inactiva. Debe el mes actual. La cuota del mes actual está pendiente y en app/admin figura como activo.");
    });
  });

  describe("Socio inactivo en el sistema", () => {
    it("debe mostrar inactivo aunque tenga cuotas pagadas", () => {
      const inactiveCredential: MemberCredentialDTO = {
        ...mockCredential,
        member: {
          ...mockCredential.member,
          status: "INACTIVE",
        },
      };
      
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`;
      
      const currentDues = [
        { dueDate: currentDueDate, status: "PAID" },
      ];
      
      const result = getCredentialStatus(inactiveCredential, { paidCount: 5, totalCount: 360, percentage: 1 }, currentDues);
      
      expect(result.label).toBe("Socio Regular Inactivo");
      expect(result.tone).toBe("warning");
      expect(result.message).toBe("Tu credencial está inactiva. Contactar con el administrador. La cuota del mes actual está pendiente y en app/admin figura como inactivo.");
    });

    it("debe mostrar inactivo con cuota pendiente", () => {
      const inactiveCredential: MemberCredentialDTO = {
        ...mockCredential,
        member: {
          ...mockCredential.member,
          status: "INACTIVE",
        },
      };
      
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`;
      
      const currentDues = [
        { dueDate: currentDueDate, status: "PENDING" },
      ];
      
      const result = getCredentialStatus(inactiveCredential, { paidCount: 5, totalCount: 360, percentage: 1 }, currentDues);
      
      expect(result.label).toBe("Socio Regular Inactivo");
      expect(result.tone).toBe("warning");
      expect(result.message).toBe("Tu credencial está inactiva. Contactar con el administrador. La cuota del mes actual está pendiente y en app/admin figura como inactivo.");
    });
  });

  describe("Socio vitalicio", () => {
    it("debe mostrar vitalicio activo con 360+ cuotas pagadas", () => {
      const result = getCredentialStatus(mockCredential, { paidCount: 360, totalCount: 360, percentage: 100 }, []);
      
      expect(result.label).toBe("Socio Vitalicio Activo");
      expect(result.tone).toBe("success");
      expect(result.message).toBe("Tu credencial vitalicia está activada. Socio activo.");
    });

    it("debe mostrar vitalicio inactivo si está inactivo en admin", () => {
      const inactiveVitalicioCredential: MemberCredentialDTO = {
        ...mockCredential,
        member: {
          ...mockCredential.member,
          status: "INACTIVE",
        },
      };
      
      const result = getCredentialStatus(inactiveVitalicioCredential, { paidCount: 360, totalCount: 360, percentage: 100 }, []);
      
      expect(result.label).toBe("Socio Vitalicio Inactivo");
      expect(result.tone).toBe("warning");
      expect(result.message).toBe("Tu credencial vitalicia está inactiva. Socio inactivo. Pago 360 cuotas, pero en app/admin figura como inactivo");
    });

    it("debe mostrar vitalicio activo con más de 360 cuotas pagadas", () => {
      const result = getCredentialStatus(mockCredential, { paidCount: 361, totalCount: 361, percentage: 100 }, []);
      
      expect(result.label).toBe("Socio Vitalicio Activo");
      expect(result.tone).toBe("success");
      expect(result.message).toBe("Tu credencial vitalicia está activada. Socio activo.");
    });
  });

  describe("Transición de primer mes a segundo mes", () => {
    it("debe cambiar de cobertura a inactivo cuando pasa el mes sin pagar", () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().split('T')[0];
      
      const pastCredential: MemberCredentialDTO = {
        ...mockCredential,
        enrollment: {
          id: "test-enrollment-id",
          planName: "Plan Regular",
          monthlyAmount: 35000,
          status: "ACTIVE",
          startDate: lastMonthStr,
          updatedAt: lastMonthStr,
        },
      };
      
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`;
      
      const currentDues = [
        { dueDate: currentDueDate, status: "PENDING" },
      ];
      
      const result = getCredentialStatus(pastCredential, { paidCount: 0, totalCount: 1, percentage: 0 }, currentDues);
      
      expect(result.label).toBe("Socio Regular Inactivo");
      expect(result.tone).toBe("warning");
      expect(result.message).toBe("Tu credencial está inactiva. Debe el mes actual. La cuota del mes actual está pendiente y en app/admin figura como activo.");
    });

    it("debe cambiar de cobertura a activo cuando pasa el mes y paga", () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().split('T')[0];
      
      const pastCredential: MemberCredentialDTO = {
        ...mockCredential,
        enrollment: {
          id: "test-enrollment-id",
          planName: "Plan Regular",
          monthlyAmount: 35000,
          status: "ACTIVE",
          startDate: lastMonthStr,
          updatedAt: lastMonthStr,
        },
      };
      
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`;
      
      const currentDues = [
        { dueDate: currentDueDate, status: "PAID" },
      ];
      
      const result = getCredentialStatus(pastCredential, { paidCount: 1, totalCount: 1, percentage: 100 }, currentDues);
      
      expect(result.label).toBe("Socio Regular Activo");
      expect(result.tone).toBe("success");
      expect(result.message).toBe("Tu credencial vitalicia está activada. Socio activo. La cuota del mes actual está pagada y en app/admin figura como activo.");
    });
  });
});
