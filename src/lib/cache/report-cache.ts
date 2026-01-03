import type { ReportResponse } from "@/types/report";
import type { ReportFiltersSchema } from "@/lib/validations/reports";

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos

function buildKey(filters: ReportFiltersSchema) {
  return JSON.stringify(filters);
}

const reportCache = new Map<
  string,
  { expiresAt: number; value: ReportResponse }
>();

export function getCachedReport(filters: ReportFiltersSchema) {
  const key = buildKey(filters);
  const entry = reportCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    reportCache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedReport(
  filters: ReportFiltersSchema,
  value: ReportResponse,
) {
  const key = buildKey(filters);
  reportCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function clearReportCache() {
  reportCache.clear();
}
