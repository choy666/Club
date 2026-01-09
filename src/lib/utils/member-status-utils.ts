import { getTodayLocal } from "./date-utils";

import type { MemberCredentialDTO } from "@/types/enrollment";

/**
 * Determina si un socio está en su primer mes de cobertura (recién inscripto)
 * Los socios recién inscriptos tienen cobertura por un mes sin necesidad de cuotas
 */
function isFirstMonthCoverage(enrollment: MemberCredentialDTO["enrollment"]): boolean {
  if (!enrollment) return false;

  // Obtener fecha de inscripción y fecha actual
  const enrollmentDate = new Date(enrollment.startDate);
  const today = new Date(getTodayLocal());

  // Calcular la diferencia en meses
  const monthsDiff =
    (today.getFullYear() - enrollmentDate.getFullYear()) * 12 +
    (today.getMonth() - enrollmentDate.getMonth());

  // Si está en el mismo mes de inscripción, tiene cobertura
  if (monthsDiff < 0) return false; // Inscripción futura (no debería pasar)
  if (monthsDiff === 0) return true; // Mismo mes de inscripción

  // Si pasó al siguiente mes, ya no tiene cobertura gratuita
  // La cobertura termina exactamente cuando cambia el mes
  return false;
}

/**
 * Determina si un socio está al día con la cuota del mes actual
 */
export function isCurrentMonthDuePaid(
  currentDues: Array<{ dueDate: string; status: string }>,
  memberStatus: string
): boolean {
  // Si el socio está marcado como INACTIVE en el sistema, no está al día
  if (memberStatus === "INACTIVE") {
    return false;
  }

  // Obtener fecha actual en formato local
  const today = new Date(getTodayLocal());
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11

  // Buscar cuota del mes actual
  const currentMonthDue = currentDues.find((due) => {
    const dueDate = new Date(due.dueDate);
    return dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth;
  });

  // Si no hay cuota para el mes actual, asumimos que está pendiente
  if (!currentMonthDue) {
    return false;
  }

  // La cuota está pagada si su estado es PAID
  return currentMonthDue.status === "PAID";
}

/**
 * Determina el estado detallado de la credencial según las reglas solicitadas
 */
export function getCredentialStatus(
  credential: MemberCredentialDTO | null,
  duesStats: { paidCount: number; totalCount: number; percentage: number } | null,
  currentDues: Array<{ dueDate: string; status: string }> = []
) {
  if (!credential)
    return {
      label: "Sin datos",
      tone: "neutral",
      message: "Esperando datos para generar tu credencial",
    };
  if (!credential.enrollment)
    return {
      label: "Sin inscripción",
      tone: "neutral",
      message: "Esperando datos para generar tu credencial",
    };
  if (!credential.isReady) {
    if (credential.enrollment.status !== "ACTIVE") {
      return {
        label: "Inscripción pendiente",
        tone: "warning",
        message: "Completá los pasos necesarios para activar tu credencial",
      };
    }
    return {
      label: "Credencial en proceso",
      tone: "warning",
      message: "Completá los pasos necesarios para activar tu credencial",
    };
  }

  // Determinar si es vitalicio
  const isVitalicio = (duesStats?.paidCount || 0) >= 360;
  const memberStatus = credential.member.status;

  // Verificar si está en primer mes de cobertura (recién inscripto)
  const isFirstMonth = isFirstMonthCoverage(credential.enrollment);

  // Verificar si está al día con el mes actual
  const isCurrentMonthPaid = isCurrentMonthDuePaid(currentDues, memberStatus) || isFirstMonth;

  // Socio Vitalicio
  if (isVitalicio) {
    if (memberStatus === "ACTIVE") {
      return {
        label: "Socio Vitalicio Activo",
        tone: "success",
        message: "Tu credencial vitalicia está activada. Socio activo.",
      };
    } else {
      return {
        label: "Socio Vitalicio Inactivo",
        tone: "warning",
        message:
          "Tu credencial vitalicia está inactiva. Socio inactivo. Pago 360 cuotas, pero en app/admin figura como inactivo",
      };
    }
  }

  // Socio Regular - Caso especial para recién inscriptos
  if (isFirstMonth && memberStatus === "ACTIVE") {
    return {
      label: "Socio Regular Activo",
      tone: "success",
      message:
        "¡Bienvenido! Tu credencial está activa. Tienes cobertura por tu primer mes de inscripción.",
    };
  }

  // Socio Regular
  if (memberStatus === "ACTIVE") {
    if (isCurrentMonthPaid) {
      return {
        label: "Socio Regular Activo",
        tone: "success",
        message:
          "Tu credencial vitalicia está activada. Socio activo. La cuota del mes actual está pagada y en app/admin figura como activo.",
      };
    } else {
      return {
        label: "Socio Regular Inactivo",
        tone: "warning",
        message:
          "Tu credencial está inactiva. Debe el mes actual. La cuota del mes actual está pendiente y en app/admin figura como activo.",
      };
    }
  } else {
    // memberStatus === "INACTIVE" u otros
    if (isCurrentMonthPaid) {
      // Este caso es poco probable pero lo manejamos
      return {
        label: "Socio Regular Inactivo",
        tone: "warning",
        message: "Tu credencial está inactiva. Contactar con el administrador.",
      };
    } else {
      return {
        label: "Socio Regular Inactivo",
        tone: "warning",
        message:
          "Tu credencial está inactiva. Contactar con el administrador. La cuota del mes actual está pendiente y en app/admin figura como inactivo.",
      };
    }
  }
}
