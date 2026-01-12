import { getTodayLocal, fromLocalDateOnly, addMonthsLocal } from "./date-utils";

import type { MemberCredentialDTO } from "@/types/enrollment";

/**
 * Determina si un socio está en su primer mes de cobertura (recién inscripto)
 * Los socios recién inscriptos tienen cobertura por un mes sin necesidad de cuotas
 */
export function isFirstMonthCoverage(enrollment: MemberCredentialDTO["enrollment"]): boolean {
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
 * Determina si un socio tiene cobertura vigente basada en cuotas pagadas y fecha de inscripción
 */
export function hasActiveCoverage(
  enrollment: MemberCredentialDTO["enrollment"],
  paidCount: number
): boolean {
  if (!enrollment) return false;

  // Calcular fecha de vencimiento de cobertura
  const enrollmentDate = fromLocalDateOnly(enrollment.startDate);
  const coverageMonths = paidCount + 1; // +1 por el mes de inscripción
  const coverageEndDate = addMonthsLocal(enrollmentDate, coverageMonths);

  // La cobertura está vigente si la fecha de vencimiento es posterior a hoy
  // Importante: debe ser estrictamente mayor, no igual, para que expire el mismo día
  const today = new Date(getTodayLocal());

  // Debug logs para hasActiveCoverage
  console.log("📅 [ACTIVE COVERAGE] Debug:");
  console.log("  - enrollment.startDate:", enrollment.startDate);
  console.log("  - enrollmentDate:", enrollmentDate);
  console.log("  - paidCount:", paidCount);
  console.log("  - coverageMonths:", coverageMonths);
  console.log("  - coverageEndDate:", coverageEndDate);
  console.log("  - today:", today);
  console.log("  - coverageEndDate > today:", coverageEndDate > today);

  // Cambiado a > en lugar de >= para que expire el mismo día que termina
  return coverageEndDate > today;
}

/**
 * Determina el estado del miembro usando la misma lógica que el API de reportes
 * Esta función replica exactamente la lógica de /api/socios/list/route.ts
 */
export function getMemberStatusFromReports(
  memberStatus: string,
  hasVitalicio: boolean,
  totalPagos: number,
  isFirstMonth: boolean,
  isCurrentMonthPaid: boolean
): string {
  // Usar exactamente la misma lógica que el API de reportes
  if (memberStatus === "INACTIVE") {
    if (hasVitalicio) {
      return "Vitalicio Inactivo";
    } else if (totalPagos >= 360) {
      return "Vitalicio Inactivo";
    } else {
      return "Regular Inactivo";
    }
  } else if (memberStatus === "PENDING") {
    return "Pendiente";
  } else if (memberStatus === "ACTIVE") {
    // Determinar si es vitalicio
    if (hasVitalicio || totalPagos >= 360) {
      return "Vitalicio Activo";
    } else {
      // Es un miembro regular - aplicar lógica de cobertura
      if (isFirstMonth) {
        // Recién inscripto: siempre está activo sin importar cuotas
        return "Regular Activo";
      } else {
        // Fuera del período de cobertura: verificar cuota del mes actual
        if (isCurrentMonthPaid) {
          return "Regular Activo";
        } else {
          return "Regular Inactivo";
        }
      }
    }
  } else if (memberStatus === "VITALICIO") {
    return "Vitalicio Activo";
  } else {
    return "Pendiente"; // Estado por defecto
  }
}

/**
 * Función de prueba para verificar los cálculos de estado
 * Esta función ayuda a diagnosticar problemas en la lógica
 */
export function testCredentialStatus(
  credential: MemberCredentialDTO | null,
  duesStats: { paidCount: number; totalCount: number; percentage: number } | null
) {
  console.log("🧪 [TEST] Iniciando prueba de estado de credencial");
  console.log("🧪 [TEST] Datos recibidos:");
  console.log("  - credential:", credential);
  console.log("  - duesStats:", duesStats);

  if (!credential) {
    console.log("🧪 [TEST] ❌ No hay credencial");
    return { label: "Sin datos", tone: "neutral", message: "Esperando datos" };
  }

  if (!credential.enrollment) {
    console.log("🧪 [TEST] ❌ No hay inscripción");
    return { label: "Sin inscripción", tone: "neutral", message: "Esperando inscripción" };
  }

  // Extraer datos básicos
  const memberStatus = credential.member.status;
  const hasVitalicio = credential.enrollment.planName === "VITALICIO";
  const totalPagos = duesStats?.paidCount || 0;
  const enrollmentDate = credential.enrollment.startDate;

  console.log("🧪 [TEST] Datos extraídos:");
  console.log("  - memberStatus:", memberStatus);
  console.log("  - hasVitalicio:", hasVitalicio);
  console.log("  - totalPagos:", totalPagos);
  console.log("  - enrollmentDate:", enrollmentDate);

  // Verificar primer mes
  const isFirstMonth = isFirstMonthCoverage(credential.enrollment);
  console.log("🧪 [TEST] Primer mes:", isFirstMonth);

  // Verificar cobertura
  const hasCoverage = hasActiveCoverage(credential.enrollment, totalPagos);
  console.log("🧪 [TEST] Tiene cobertura:", hasCoverage);

  // Verificar si está al día
  const isCurrentMonthPaid = hasCoverage || isFirstMonth;
  console.log("🧪 [TEST] Está al día:", isCurrentMonthPaid);

  // Aplicar lógica de reportes
  let estadoFinal = "Desconocido";

  if (memberStatus === "INACTIVE") {
    if (hasVitalicio) {
      estadoFinal = "Vitalicio Inactivo";
    } else if (totalPagos >= 300) {
      estadoFinal = "Vitalicio Inactivo";
    } else {
      estadoFinal = "Regular Inactivo";
    }
  } else if (memberStatus === "PENDING") {
    estadoFinal = "Pendiente";
  } else if (memberStatus === "ACTIVE") {
    if (hasVitalicio || totalPagos >= 300) {
      estadoFinal = "Vitalicio Activo";
    } else {
      if (isFirstMonth) {
        estadoFinal = "Regular Activo";
      } else {
        if (isCurrentMonthPaid) {
          estadoFinal = "Regular Activo";
        } else {
          estadoFinal = "Regular Inactivo";
        }
      }
    }
  } else if (memberStatus === "VITALICIO") {
    estadoFinal = "Vitalicio Activo";
  }

  console.log("🧪 [TEST] Estado final calculado:", estadoFinal);

  // Retornar resultado con todos los casos manejados
  switch (estadoFinal) {
    case "Regular Activo":
      return {
        label: "Socio Regular Activo",
        tone: "success",
        message: isFirstMonth
          ? "¡Bienvenido! Tu credencial está activa. Tienes cobertura por tu primer mes de inscripción."
          : "Credencial activa, La cuota del mes actual está pagada.",
      };
    case "Regular Inactivo":
      return {
        label: "Socio Regular Inactivo",
        tone: "warning",
        message: "Tu credencial está inactiva. La cuota del mes actual está pendiente.",
      };
    default:
      return {
        label: estadoFinal,
        tone: "neutral",
        message: "Estado desconocido",
      };
  }
}

/**
 * Determina el estado detallado de la credencial según las reglas solicitadas
 */
export function getCredentialStatus(
  credential: MemberCredentialDTO | null,
  duesStats: { paidCount: number; totalCount: number; percentage: number } | null
) {
  console.log("🔍 [CREDENTIAL] INICIO - getCredentialStatus llamado");
  console.log("📊 [CREDENTIAL] Datos recibidos:");
  console.log("  - credential:", credential);
  console.log("  - duesStats:", duesStats);

  if (!credential) {
    console.log("❌ [CREDENTIAL] No hay credencial - retornando Sin datos");
    return {
      label: "Sin datos",
      tone: "neutral",
      message: "Esperando datos para generar tu credencial",
    };
  }

  if (!credential.enrollment) {
    console.log("❌ [CREDENTIAL] No hay inscripción - retornando Sin inscripción");
    return {
      label: "Sin inscripción",
      tone: "neutral",
      message: "Esperando datos para generar tu credencial",
    };
  }

  if (!credential.isReady) {
    console.log("⚠️ [CREDENTIAL] Credencial no está ready - isReady:", credential.isReady);
    if (credential.enrollment.status !== "ACTIVE") {
      console.log(
        "⚠️ [CREDENTIAL] Inscripción no está activa - status:",
        credential.enrollment.status
      );
      return {
        label: "Inscripción pendiente",
        tone: "warning",
        message: "Completá los pasos necesarios para activar tu credencial",
      };
    }
    // Si isReady es false pero la inscripción está activa, tratar como socio regular inactivo
    console.log(
      "⚠️ [CREDENTIAL] isReady false pero inscripción activa - tratando como Regular Inactivo"
    );
    return {
      label: "Socio Regular Inactivo",
      tone: "warning",
      message: "Tu credencial está inactiva. La cuota del mes actual está pendiente.",
    };
  }

  // Usar exactamente la misma lógica que el API de reportes
  const memberStatus = credential.member.status;
  const hasVitalicio = credential.enrollment.planName === "VITALICIO";
  const totalPagos = duesStats?.paidCount || 0;

  console.log("🔍 [CREDENTIAL] Análisis de estado:");
  console.log("  - member.status:", memberStatus);
  console.log("  - member.status type:", typeof memberStatus);
  console.log("  - enrollment.planName:", credential.enrollment.planName);
  console.log("  - enrollment.planName type:", typeof credential.enrollment.planName);
  console.log("  - hasVitalicio:", hasVitalicio);
  console.log("  - totalPagos:", totalPagos);
  console.log("  - totalPagos >= 300:", totalPagos >= 300);
  console.log("  - totalPagos >= 360:", totalPagos >= 360);
  console.log("  - credential.isReady:", credential.isReady);
  console.log("  - credential.enrollment.status:", credential.enrollment.status);
  console.log("  - credential.enrollment.status type:", typeof credential.enrollment.status);

  // Verificar si está en primer mes de cobertura (recién inscripto)
  const isFirstMonth = isFirstMonthCoverage(credential.enrollment);
  console.log("  - isFirstMonth:", isFirstMonth);

  // Para la lógica de reportes, necesitamos verificar si está al día con el mes actual
  // Usamos la misma lógica que el API: si tiene cobertura vigente o es primer mes, está al día
  const hasCoverage = hasActiveCoverage(credential.enrollment, totalPagos);
  const isCurrentMonthPaid = hasCoverage || isFirstMonth;

  console.log("🔍 [CREDENTIAL] Análisis de cobertura:");
  console.log("  - hasCoverage:", hasCoverage);
  console.log("  - isCurrentMonthPaid:", isCurrentMonthPaid);

  // Usar la función unificada que replica la lógica del API de reportes
  const estadoCompleto = getMemberStatusFromReports(
    memberStatus,
    hasVitalicio,
    totalPagos,
    isFirstMonth,
    isCurrentMonthPaid
  );

  console.log("🎯 [CREDENTIAL] Estado final calculado:", estadoCompleto);
  console.log("🔍 [CREDENTIAL] Análisis detallado:");
  console.log("  - memberStatus:", memberStatus);
  console.log("  - hasVitalicio:", hasVitalicio);
  console.log("  - totalPagos:", totalPagos);
  console.log("  - totalPagos >= 300:", totalPagos >= 300);
  console.log("  - totalPagos >= 360:", totalPagos >= 360);
  console.log("  - isFirstMonth:", isFirstMonth);
  console.log("  - isCurrentMonthPaid:", isCurrentMonthPaid);
  console.log("  - estadoCompleto:", estadoCompleto);

  // Mapear el estado al formato de credencial
  let resultado;
  switch (estadoCompleto) {
    case "Vitalicio Activo":
      resultado = {
        label: "Socio Vitalicio Activo",
        tone: "success",
        message: "Tu credencial vitalicia está activada. Socio activo.",
      };
      break;
    case "Vitalicio Inactivo":
      resultado = {
        label: "Socio Vitalicio Inactivo",
        tone: "warning",
        message: "Pago 360 cuotas, pero esta inactivo como socio",
      };
      break;
    case "Regular Activo":
      resultado = {
        label: "Socio Regular Activo",
        tone: "success",
        message: isFirstMonth
          ? "¡Bienvenido! Tu credencial está activa. Tienes cobertura por tu primer mes de inscripción."
          : "Credencial activa, La cuota del mes actual está pagada.",
      };
      break;
    case "Regular Inactivo":
      resultado = {
        label: "Socio Regular Inactivo",
        tone: "warning",
        message: "Tu credencial está inactiva. La cuota del mes actual está pendiente.",
      };
      break;
    case "Pendiente":
      resultado = {
        label: "Inscripción pendiente",
        tone: "warning",
        message: "Completá los pasos necesarios para activar tu credencial",
      };
      break;
    default:
      resultado = {
        label: "Estado desconocido",
        tone: "neutral",
        message: "Contactar con el administrador",
      };
      break;
  }

  console.log("📤 [CREDENTIAL] Resultado final:", resultado);
  console.log("🔍 [CREDENTIAL] FIN - getCredentialStatus completado");

  return resultado;
}
