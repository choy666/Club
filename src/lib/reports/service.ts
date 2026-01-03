import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { dues, enrollments, members, payments } from "@/db/schema";
import { formatDateOnly } from "@/lib/enrollments/schedule";
import { getCachedReport, setCachedReport } from "@/lib/cache/report-cache";
import type { ReportBlock, ReportResponse } from "@/types/report";
import type { ReportFiltersSchema } from "@/lib/validations/reports";

function combineFilters(
  filters: (SQL<unknown> | undefined)[],
): SQL<unknown> | undefined {
  const valid = filters.filter((expression): expression is SQL<unknown> =>
    Boolean(expression),
  );
  if (!valid.length) {
    return undefined;
  }
  if (valid.length === 1) {
    return valid[0];
  }
  return and(...valid);
}

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === "number" ? value : Number(value);
}

function toUtcDate(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
}

function buildTrend(
  currentValue: number,
  previousValue: number,
  comparisonLabel: string,
) {
  if (!Number.isFinite(previousValue)) {
    return undefined;
  }

  if (previousValue === 0 && currentValue === 0) {
    return undefined;
  }

  const rawDelta =
    previousValue === 0
      ? currentValue === 0
        ? 0
        : 100
      : ((currentValue - previousValue) / Math.abs(previousValue)) * 100;

  return {
    delta: Number(rawDelta.toFixed(2)),
    direction: rawDelta >= 0 ? "up" : "down",
    comparisonLabel,
  } as ReportBlock["trend"];
}

export async function getReports(
  filters: ReportFiltersSchema,
): Promise<ReportResponse> {
  const cached = getCachedReport(filters);
  if (cached) {
    return cached;
  }

  const dateFrom = new Date(filters.dateFrom);
  const dateTo = new Date(filters.dateTo);
  const periodMs = Math.max(1, dateTo.getTime() - dateFrom.getTime());
  const previousDateTo = new Date(dateFrom);
  const previousDateFrom = new Date(previousDateTo.getTime() - periodMs);
  const dueDateFrom = formatDateOnly(dateFrom);
  const dueDateTo = formatDateOnly(dateTo);
  const previousDueDateFrom = formatDateOnly(previousDateFrom);
  const previousDueDateTo = formatDateOnly(previousDateTo);

  const planFilter = filters.planId
    ? eq(enrollments.planName, filters.planId)
    : undefined;

  const revenueWhere = combineFilters([
    gte(payments.paidAt, dateFrom),
    lte(payments.paidAt, dateTo),
    planFilter,
  ]);

  const duesRangeWhere = combineFilters([
    gte(dues.dueDate, dueDateFrom),
    lte(dues.dueDate, dueDateTo),
    planFilter,
  ]);

  const [
    totalRevenueRows,
    projectedRevenueRows,
    portfolioRows,
    newMembersRows,
    churnRows,
    totalMembersRows,
    collectionRows,
  ] = await Promise.all([
    db
      .select({ value: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .innerJoin(dues, eq(payments.dueId, dues.id))
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .where(revenueWhere),
    db
      .select({ value: sql<number>`coalesce(sum(${dues.amount}), 0)` })
      .from(dues)
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .where(
        combineFilters([
          duesRangeWhere,
          // Sólo cuotas abiertas cuentan para el MRR estimado.
          eq(dues.status, "PENDING"),
        ]),
      ),
    db
      .select({
        status: dues.status,
        total: count(),
      })
      .from(dues)
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .where(duesRangeWhere)
      .groupBy(dues.status),
    db
      .select({ value: count() })
      .from(members)
      .where(
        combineFilters([
          gte(members.createdAt, dateFrom),
          lte(members.createdAt, dateTo),
        ]),
      ),
    db
      .select({ value: count() })
      .from(members)
      .where(
        combineFilters([
          eq(members.status, "INACTIVE"),
          gte(members.updatedAt, dateFrom),
          lte(members.updatedAt, dateTo),
        ]),
      ),
    db.select({ value: count() }).from(members),
    db
      .select({
        paidAt: payments.paidAt,
        dueDate: dues.dueDate,
      })
      .from(payments)
      .innerJoin(dues, eq(payments.dueId, dues.id))
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .where(revenueWhere),
  ]);

  const [
    previousRevenueRows,
    previousPortfolioRows,
    previousNewMembersRows,
    previousChurnRows,
    previousCollectionRows,
  ] = await Promise.all([
    db
      .select({ value: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .innerJoin(dues, eq(payments.dueId, dues.id))
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .where(
        combineFilters([
          gte(payments.paidAt, previousDateFrom),
          lte(payments.paidAt, previousDateTo),
          planFilter,
        ]),
      ),
    db
      .select({
        status: dues.status,
        total: count(),
      })
      .from(dues)
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .where(
        combineFilters([
          gte(dues.dueDate, previousDueDateFrom),
          lte(dues.dueDate, previousDueDateTo),
          planFilter,
        ]),
      )
      .groupBy(dues.status),
    db
      .select({ value: count() })
      .from(members)
      .where(
        combineFilters([
          gte(members.createdAt, previousDateFrom),
          lte(members.createdAt, previousDateTo),
        ]),
      ),
    db
      .select({ value: count() })
      .from(members)
      .where(
        combineFilters([
          eq(members.status, "INACTIVE"),
          gte(members.updatedAt, previousDateFrom),
          lte(members.updatedAt, previousDateTo),
        ]),
      ),
    db
      .select({
        paidAt: payments.paidAt,
        dueDate: dues.dueDate,
      })
      .from(payments)
      .innerJoin(dues, eq(payments.dueId, dues.id))
      .innerJoin(enrollments, eq(dues.enrollmentId, enrollments.id))
      .where(
        combineFilters([
          gte(payments.paidAt, previousDateFrom),
          lte(payments.paidAt, previousDateTo),
          planFilter,
        ]),
      ),
  ]);

  const totalRevenue = toNumber(totalRevenueRows[0]?.value);
  const projectedRevenue = toNumber(projectedRevenueRows[0]?.value);
  const newMembers = toNumber(newMembersRows[0]?.value);
  const churnedMembers = toNumber(churnRows[0]?.value);
  const totalMembers = Math.max(1, toNumber(totalMembersRows[0]?.value));

  const churnRate = (churnedMembers / totalMembers) * 100;
  const netGrowth = newMembers - churnedMembers;

  const collectionDurations = collectionRows.map((row) => {
    const paidAtDate = toUtcDate(row.paidAt);
    const dueDate = toUtcDate(row.dueDate);
    const diffMs = paidAtDate.getTime() - dueDate.getTime();
    return diffMs / (1000 * 60 * 60 * 24);
  });
  const averageCollectionDays = collectionDurations.length
    ? collectionDurations.reduce((acc, value) => acc + value, 0) /
      collectionDurations.length
    : 0;

  const portfolioTotals = portfolioRows.map((row) => ({
    status: row.status,
    total: toNumber(row.total as number | string | null),
  }));
  const totalPortfolioItems = portfolioTotals.reduce(
    (acc, row) => acc + row.total,
    0,
  );

  const statusLabels: Record<string, string> = {
    PAID: "Pagadas",
    PENDING: "Pendientes",
    OVERDUE: "Vencidas",
  };

  const portfolioBreakdown =
    totalPortfolioItems > 0
      ? portfolioTotals.map((row) => ({
          label: statusLabels[row.status] ?? row.status,
          value: row.total,
          percentage: (row.total / totalPortfolioItems) * 100,
        }))
      : [];

  const previousTotalRevenue = toNumber(previousRevenueRows[0]?.value);
  const previousNewMembers = toNumber(previousNewMembersRows[0]?.value);
  const previousChurnedMembers = toNumber(previousChurnRows[0]?.value);
  const previousNetGrowth = previousNewMembers - previousChurnedMembers;
  const previousCollectionDurations = previousCollectionRows.map((row) => {
    const paidAtDate = toUtcDate(row.paidAt);
    const dueDate = toUtcDate(row.dueDate);
    const diffMs = paidAtDate.getTime() - dueDate.getTime();
    return diffMs / (1000 * 60 * 60 * 24);
  });
  const previousAverageCollectionDays = previousCollectionDurations.length
    ? previousCollectionDurations.reduce((acc, value) => acc + value, 0) /
      previousCollectionDurations.length
    : 0;

  const previousPortfolioTotals = previousPortfolioRows.map((row) => ({
    status: row.status,
    total: toNumber(row.total as number | string | null),
  }));
  const previousTotalPortfolioItems = previousPortfolioTotals.reduce(
    (acc, row) => acc + row.total,
    0,
  );

  const comparisonLabel = `vs periodo anterior (${Math.round(
    periodMs / (1000 * 60 * 60 * 24),
  )} días)`;

  const currency = filters.currency ?? "ARS";
  const paidItems = portfolioBreakdown.find((item) => item.label === "Pagadas");
  const collectionRate =
    totalPortfolioItems > 0 && paidItems
      ? (paidItems.value / totalPortfolioItems) * 100
      : 0;

  const previousPaid = previousPortfolioTotals.find(
    (item) => statusLabels[item.status] === "Pagadas",
  );
  const previousCollectionRate =
    previousTotalPortfolioItems > 0 && previousPaid
      ? (previousPaid.total / previousTotalPortfolioItems) * 100
      : 0;

  const averageRevenuePerMember = totalRevenue / Math.max(1, totalMembers ?? 1);

  const blocks: ReportBlock[] = [
    {
      kpiId: "total-revenue",
      label: "Ingresos cobrados",
      value: Number(totalRevenue.toFixed(2)),
      unit: currency,
      description: "Pagos registrados dentro del rango seleccionado.",
      trend: buildTrend(totalRevenue, previousTotalRevenue, comparisonLabel),
    },
    {
      kpiId: "projected-mrr",
      label: "MRR proyectado",
      value: Number(projectedRevenue.toFixed(2)),
      unit: currency,
      description: "Suma de cuotas abiertas en el periodo.",
    },
    {
      kpiId: "churn-rate",
      label: "Churn estimado",
      value: Number(churnRate.toFixed(2)),
      unit: "%",
      description:
        "Socios dados de baja respecto al total vigente en el periodo.",
      trend: buildTrend(
        churnRate,
        (previousChurnedMembers / totalMembers) * 100,
        comparisonLabel,
      ),
    },
    {
      kpiId: "net-growth",
      label: "Crecimiento neto",
      value: netGrowth,
      unit: "socios",
      description: "Altas menos bajas en el periodo consultado.",
      trend: buildTrend(netGrowth, previousNetGrowth, comparisonLabel),
    },
    {
      kpiId: "collection-cycle",
      label: "Ciclo promedio de cobro",
      value: Number(averageCollectionDays.toFixed(2)),
      unit: "días",
      description: "Tiempo promedio entre la fecha de cuota y el pago.",
      trend: buildTrend(
        averageCollectionDays,
        previousAverageCollectionDays,
        comparisonLabel,
      ),
    },
    {
      kpiId: "portfolio-health",
      label: "Salud de cartera",
      value: 100,
      unit: "%",
      breakdown: portfolioBreakdown,
      description: "Distribución de cuotas por estado en el periodo.",
    },
    {
      kpiId: "collection-rate",
      label: "Índice de cobranza",
      value: Number(collectionRate.toFixed(2)),
      unit: "%",
      description: "Porcentaje de cuotas cobradas vs. totales en el periodo.",
      trend: buildTrend(
        collectionRate,
        previousCollectionRate,
        comparisonLabel,
      ),
    },
    {
      kpiId: "avg-revenue-member",
      label: "Ingreso promedio por socio",
      value: Number(averageRevenuePerMember.toFixed(2)),
      unit: currency,
      description: "Ticket promedio considerando socios activos.",
      trend: buildTrend(
        averageRevenuePerMember,
        previousTotalRevenue / Math.max(1, totalMembers),
        comparisonLabel,
      ),
    },
  ];

  const result: ReportResponse = {
    filters,
    generatedAt: new Date().toISOString(),
    data: blocks,
  };

  setCachedReport(filters, result);

  return result;
}
