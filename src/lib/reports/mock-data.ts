import type { ReportBlock, ReportFiltersInput, ReportResponse } from "@/types/report";

const mockBlocks: ReportBlock[] = [
  {
    kpiId: "mrr",
    label: "MRR proyectado",
    value: 1250000,
    unit: "ARS",
    trend: {
      delta: 8.5,
      direction: "up",
      comparisonLabel: "vs. mes anterior",
    },
    breakdown: [
      { label: "Planes estándar", value: 820000, percentage: 65.6 },
      { label: "Planes premium", value: 430000, percentage: 34.4 },
    ],
  },
  {
    kpiId: "churn-rate",
    label: "Tasa de churn",
    value: 3.1,
    unit: "%",
    trend: {
      delta: -0.4,
      direction: "down",
      comparisonLabel: "vs. mes anterior",
    },
  },
  {
    kpiId: "collection-cycle",
    label: "Ciclo de cobro promedio",
    value: 4.2,
    unit: "días",
  },
  {
    kpiId: "portfolio-health",
    label: "Distribución de cartera",
    value: 100,
    unit: "%",
    breakdown: [
      { label: "Al día", value: 68, percentage: 68 },
      { label: "Pendientes", value: 22, percentage: 22 },
      { label: "Vencidas", value: 10, percentage: 10 },
    ],
  },
];

export function buildMockReportResponse(filters: ReportFiltersInput): ReportResponse {
  return {
    filters,
    generatedAt: new Date().toISOString(),
    data: mockBlocks,
  };
}
