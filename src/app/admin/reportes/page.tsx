"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { useReports } from "@/hooks/use-reports";
import type { ReportFiltersInput } from "@/types/report";

function createDefaultFilters(): ReportFiltersInput {
  const now = new Date();
  const dateTo = now.toISOString();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  return {
    dateFrom: thirtyDaysAgo.toISOString(),
    dateTo,
    granularity: "weekly",
    planId: undefined,
    currency: "ARS",
  };
}

const MotionCard = motion.article;
const MotionSection = motion.section;
const MotionDiv = motion.div;

export default function AdminReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersInput>(() =>
    createDefaultFilters(),
  );
  const [formState, setFormState] = useState<ReportFiltersInput>(filters);

  const reportsQuery = useReports(filters);

  function handleFormChange<K extends keyof ReportFiltersInput>(
    key: K,
    value: ReportFiltersInput[K],
  ) {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(formState);
  }

  function handleReset() {
    const defaults = createDefaultFilters();
    setFormState(defaults);
    setFilters(defaults);
  }

  const hasData = (reportsQuery.data?.data?.length ?? 0) > 0;

  const portfolioBlock = useMemo(
    () =>
      reportsQuery.data?.data.find(
        (block) => block.kpiId === "portfolio-health",
      ),
    [reportsQuery.data],
  );

  const portfolioChartData = useMemo(() => {
    return (
      portfolioBlock?.breakdown?.map((item) => ({
        ...item,
        fill:
          item.label === "Pagadas"
            ? "#2dd4bf"
            : item.label === "Pendientes"
              ? "#fbbf24"
              : "#f87171",
        value: Number(item.value ?? 0),
      })) ?? []
    );
  }, [portfolioBlock]);

  return (
    <div className="min-h-screen bg-base-primary px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <motion.header
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-sm uppercase tracking-[0.25em] text-base-muted">
            Panel administrativo
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold font-[var(--font-space)]">
                Reportes y métricas
              </h1>
              <p className="mt-2 text-base text-base-muted">
                Visualizá KPIs financieros, tendencias de crecimiento y salud de
                cartera en un tablero con temática glass.
              </p>
            </div>
          </div>
        </motion.header>

        <form
          className="glass-card flex flex-col gap-4 border border-base-border/60 p-4 md:flex-row md:items-end md:justify-between"
          onSubmit={handleSubmit}
        >
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-2 text-sm text-base-muted">
              Fecha desde
              <input
                type="date"
                className="rounded-md border border-base-border bg-transparent px-3 py-2 text-base text-base-foreground"
                value={formState.dateFrom.slice(0, 10)}
                max={formState.dateTo.slice(0, 10)}
                onChange={(event) =>
                  handleFormChange(
                    "dateFrom",
                    new Date(event.target.value).toISOString(),
                  )
                }
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-base-muted">
              Fecha hasta
              <input
                type="date"
                className="rounded-md border border-base-border bg-transparent px-3 py-2 text-base text-base-foreground"
                value={formState.dateTo.slice(0, 10)}
                min={formState.dateFrom.slice(0, 10)}
                onChange={(event) =>
                  handleFormChange(
                    "dateTo",
                    new Date(event.target.value).toISOString(),
                  )
                }
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-base-muted">
              Granularidad
              <select
                className="rounded-md border border-base-border bg-transparent px-3 py-2 text-base text-base-foreground"
                value={formState.granularity}
                onChange={(event) =>
                  handleFormChange(
                    "granularity",
                    event.target.value as ReportFiltersInput["granularity"],
                  )
                }
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-base-muted">
              Código de plan (opcional)
              <input
                type="text"
                className="rounded-md border border-base-border bg-transparent px-3 py-2 text-base text-base-foreground"
                value={formState.planId ?? ""}
                placeholder="UUID del plan"
                onChange={(event) =>
                  handleFormChange(
                    "planId",
                    event.target.value.length ? event.target.value : undefined,
                  )
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-base-muted sm:col-span-2 lg:col-span-1">
              Moneda (ISO 4217)
              <input
                type="text"
                maxLength={3}
                className="rounded-md border border-base-border bg-transparent px-3 py-2 text-base text-base-foreground uppercase"
                value={formState.currency ?? ""}
                onChange={(event) =>
                  handleFormChange(
                    "currency",
                    event.target.value.length
                      ? event.target.value.toUpperCase()
                      : undefined,
                  )
                }
              />
            </label>
          </div>
          <div className="flex flex-col gap-2 md:w-48">
            <button
              type="submit"
              className="btn-primary"
              disabled={reportsQuery.isFetching}
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              disabled={reportsQuery.isFetching}
            >
              Resetear
            </button>
          </div>
        </form>

        <MotionSection
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold font-[var(--font-space)]">
              KPIs destacados
            </h2>
            <p className="text-sm text-base-muted">
              Última actualización{" "}
              {reportsQuery.data
                ? new Date(reportsQuery.data.generatedAt).toLocaleString()
                : "—"}
            </p>
          </div>

          {reportsQuery.isLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`report-skeleton-${index}`}
                  className="glass-card animate-pulse border border-base-border/30 p-4"
                >
                  <div className="h-5 w-24 rounded bg-base-border/60" />
                  <div className="mt-4 h-10 w-32 rounded bg-base-border/40" />
                  <div className="mt-6 h-4 w-full rounded bg-base-border/40" />
                </div>
              ))}
            </div>
          )}

          {reportsQuery.error && (
            <div className="glass-card border border-accent-critical/60 bg-accent-critical/10 p-4">
              <p className="font-semibold text-accent-critical">
                Ocurrió un error al cargar los reportes.
              </p>
              <p className="text-sm text-base-muted">
                {reportsQuery.error instanceof Error
                  ? reportsQuery.error.message
                  : "Intentá nuevamente más tarde."}
              </p>
              <button
                type="button"
                className="btn-secondary mt-3"
                onClick={() => reportsQuery.refetch()}
              >
                Reintentar
              </button>
            </div>
          )}

          {!reportsQuery.isLoading && !hasData && !reportsQuery.error && (
            <div className="glass-card border border-base-border/60 p-6 text-center">
              <p className="text-lg font-semibold">
                No encontramos datos para los filtros seleccionados.
              </p>
              <p className="mt-2 text-base-muted">
                Ajustá el rango de fechas o quitá filtros específicos para ver
                tendencias.
              </p>
            </div>
          )}

          {hasData && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {reportsQuery.data?.data.map((block, index) => (
                  <MotionCard
                    key={block.kpiId}
                    className="glass-card border border-base-border/40 p-5 transition hover:border-base-border"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-base-muted">
                          {block.label}
                        </p>
                        <motion.p
                          className="mt-3 text-3xl font-semibold"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.2 }}
                        >
                          {block.value.toLocaleString("es-AR", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {block.unit ? (
                            <span className="text-base text-base-muted">
                              {block.unit}
                            </span>
                          ) : null}
                        </motion.p>
                      </div>
                      {block.trend && (
                        <motion.span
                          className={`rounded-full px-3 py-1 text-sm ${
                            block.trend.direction === "up"
                              ? "bg-state-active/20 text-state-active"
                              : "bg-accent-critical/20 text-accent-critical"
                          }`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.2 }}
                        >
                          {block.trend.delta > 0 ? "+" : ""}
                          {block.trend.delta}%
                        </motion.span>
                      )}
                    </div>
                    {block.trend && (
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-base-muted">
                        {block.trend.comparisonLabel}
                      </p>
                    )}
                    {block.breakdown && block.breakdown.length > 0 && (
                      <div className="mt-5 space-y-2">
                        {block.breakdown.map((item) => (
                          <div
                            key={`${block.kpiId}-${item.label}`}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-base-muted">
                              {item.label}
                            </span>
                            <span className="font-medium">
                              {item.value.toLocaleString("es-AR")}{" "}
                              {item.percentage !== undefined
                                ? `(${item.percentage.toFixed(1)}%)`
                                : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {block.description && (
                      <p className="mt-4 text-sm text-base-muted">
                        {block.description}
                      </p>
                    )}
                  </MotionCard>
                ))}
              </div>

              {portfolioChartData.length > 0 && (
                <MotionDiv
                  className="glass-card border border-base-border/40 p-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 }}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-base-muted">
                        Visualización especial
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold">
                        Distribución de cartera
                      </h3>
                      <p className="text-base-muted">
                        Representamos el peso relativo de cada estado de cuotas
                        para identificar cuellos de botella.
                      </p>
                    </div>
                    <div className="h-64 w-full md:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          data={portfolioChartData}
                          innerRadius="20%"
                          outerRadius="90%"
                          startAngle={90}
                          endAngle={-270}
                        >
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            tick={false}
                          />
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            content={({ payload }) => {
                              if (!payload?.length) return null;
                              const entry = payload[0] as {
                                payload: {
                                  label: string;
                                  value: number;
                                  percentage?: number;
                                };
                              };
                              return (
                                <div className="rounded-md border border-base-border bg-base-primary/80 px-3 py-2 text-sm shadow-lg backdrop-blur">
                                  <p className="font-semibold">
                                    {entry.payload.label}
                                  </p>
                                  <p>
                                    {entry.payload.value.toLocaleString(
                                      "es-AR",
                                    )}{" "}
                                    ({entry.payload.percentage?.toFixed(1)}%)
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <RadialBar
                            background
                            dataKey="percentage"
                            cornerRadius={10}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </MotionDiv>
              )}
            </>
          )}
        </MotionSection>
      </div>
    </div>
  );
}
