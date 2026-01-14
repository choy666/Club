/**
 * Utilidades unificadas para manejo de fechas en AppClub
 * Todas las fechas se manejan en la zona horaria local para evitar desfasajes
 */

export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convierte una fecha al formato YYYY-MM-DD en zona horaria local
 * Esta es la función principal para normalizar fechas en todo el sistema
 */
export function toLocalDateOnly(date: Date | string): string {
  if (typeof date === "string") {
    if (DATE_ONLY_REGEX.test(date)) {
      return date; // Ya está en formato correcto
    }
    date = new Date(date);
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("Fecha inválida");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Crea una fecha local desde un string YYYY-MM-DD
 * Importante: No convierte a UTC, mantiene la fecha local exacta
 */
export function fromLocalDateOnly(dateString: string): Date {
  if (!DATE_ONLY_REGEX.test(dateString)) {
    throw new Error("Formato de fecha inválido. Se espera YYYY-MM-DD");
  }

  const [year, month, day] = dateString.split("-").map(Number);

  // Crear fecha en zona horaria local (no UTC)
  const date = new Date(year, month - 1, day);

  // Validar que la fecha sea correcta (evita fechas como 2023-02-30)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error("Fecha inválida");
  }

  return date;
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD local
 */
export function getTodayLocal(): string {
  return toLocalDateOnly(new Date());
}

/**
 * Agrega meses a una fecha manteniendo la zona horaria local
 */
export function addMonthsLocal(date: Date | string, months: number): Date {
  const baseDate = typeof date === "string" ? fromLocalDateOnly(date) : date;

  const newDate = new Date(baseDate);
  const targetMonth = newDate.getMonth() + months;
  const targetYear = newDate.getFullYear() + Math.floor(targetMonth / 12);
  const finalMonth = targetMonth % 12;

  newDate.setFullYear(targetYear, finalMonth, newDate.getDate());

  // Ajuste para fin de mes (ej: 31 de enero + 1 mes = 28/29 de febrero)
  const originalDay = baseDate.getDate();
  if (newDate.getDate() !== originalDay) {
    newDate.setDate(0); // Último día del mes anterior
  }

  return newDate;
}

/**
 * Compara dos fechas en formato YYYY-MM-DD
 * Returns: -1 si a < b, 0 si a === b, 1 si a > b
 */
export function compareDates(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Formatea una fecha YYYY-MM-DD a DD/MM/YYYY para visualización
 * Evita problemas de timezone al parsear directamente
 */
export function formatDateDDMMYYYY(dateString: string): string {
  if (!dateString || !DATE_ONLY_REGEX.test(dateString)) {
    return "N/A";
  }

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Calcula el período de cobertura de una cuota
 * Si la cuota vence el 12/02/2026, cubre desde 12/02/2026 hasta 11/03/2026
 */
export function calculateDuePeriod(dueDateString: string): { start: string; end: string } {
  if (!dueDateString || !DATE_ONLY_REGEX.test(dueDateString)) {
    return { start: "N/A", end: "N/A" };
  }

  // Usar utilidades de fecha local para consistencia
  const startDate = fromLocalDateOnly(dueDateString);

  // Fecha de fin: un mes después, un día antes
  // Usar addMonthsLocal para mantener consistencia de timezone
  const endDate = addMonthsLocal(startDate, 1);
  endDate.setDate(endDate.getDate() - 1);

  return {
    start: formatDateDDMMYYYY(dueDateString),
    end: formatDateDDMMYYYY(toLocalDateOnly(endDate)),
  };
}

/**
 * Verifica si una fecha está entre un rango (inclusive)
 */
export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return compareDates(date, startDate) >= 0 && compareDates(date, endDate) <= 0;
}

/**
 * Formatea una fecha para visualización (opcional, para UI)
 */
export function formatDateForDisplay(date: string | Date, locale = "es-AR"): string {
  const dateObj = typeof date === "string" ? fromLocalDateOnly(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Valida que una fecha sea válida y esté en formato YYYY-MM-DD
 */
export function isValidDateOnly(dateString: string): boolean {
  if (!DATE_ONLY_REGEX.test(dateString)) {
    return false;
  }

  try {
    fromLocalDateOnly(dateString);
    return true;
  } catch {
    return false;
  }
}
