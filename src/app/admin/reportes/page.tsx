"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

import { AdminLayout } from "@/components/admin/admin-layout";
import { useMembersStats } from "@/hooks/use-members-stats";
import { apiFetch } from "@/lib/api-client";
import { formatDateDDMMYYYY } from "@/lib/utils/date-utils";

interface Member {
  id: number;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  estado: "activo" | "inactivo" | "pendiente" | "vitalicio";
  estadoCompleto:
    | "Vitalicio Activo"
    | "Vitalicio Inactivo"
    | "Regular Activo"
    | "Regular Inactivo"
    | "Pendiente"
    | "Inactivo";
  estadoCuota: "al_dia" | "deudor";
  fechaIngreso: string;
  plan: "mensual" | "anual" | "vitalicio";
  ultimaCuota: string | null;
  fechaInscripcion: string | null;
  fechaCobertura: string | null;
  cuotasPagadas: number;
  cuotasPendientes: number;
}

interface MembersResponse {
  data: Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminReportesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [debtFilter, setDebtFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  const { data: stats, isLoading: statsLoading } = useMembersStats();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(debtFilter && { debtStatus: debtFilter }),
      });

      const response = await apiFetch<MembersResponse>(`/api/socios/list?${params}`);
      setMembers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error al cargar socios:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, debtFilter]);

  // Cargar socios al montar y cuando cambian los filtros
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembers();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const MotionCard = motion.div;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-bold font-[var(--font-space)] tracking-tight">
            Reportes de Socios
          </h1>
          <p className="text-base-muted">
            Panel minimalista con métricas clave y gestión de socios
          </p>
        </motion.div>

        {/* Contadores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <MotionCard
            className="neo-panel p-6 border border-base-border/40"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Total Socios</p>
              <p className="text-2xl font-bold">{statsLoading ? "..." : stats?.total || 0}</p>
            </div>
          </MotionCard>

          <MotionCard
            className="neo-panel p-6 border border-state-active/40 bg-state-active/5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Activos</p>
              <p className="text-2xl font-bold text-state-active">
                {statsLoading ? "..." : stats?.activo || 0}
              </p>
            </div>
          </MotionCard>

          <MotionCard
            className="neo-panel p-6 border border-accent-success/40 bg-accent-success/5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Activos al Día</p>
              <p className="text-2xl font-bold text-accent-success">
                {statsLoading ? "..." : stats?.alDia || 0}
              </p>
            </div>
          </MotionCard>

          <MotionCard
            className="neo-panel p-6 border border-accent-critical/40 bg-accent-critical/5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-base-muted">Inactivos</p>
              <p className="text-2xl font-bold text-accent-critical">
                {statsLoading ? "..." : stats?.inactivo || 0}
              </p>
            </div>
          </MotionCard>
        </motion.div>

        {/* Filtros y búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="neo-panel p-6 space-y-4"
        >
          <h2 className="text-xl font-semibold font-[var(--font-space)]">Búsqueda y Filtros</h2>

          <div className="grid gap-4 md:grid-cols-4">
            <input
              type="text"
              placeholder="Buscar por nombre o DNI..."
              className="input-minimal"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="select-base"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="vitalicio-activo">Vitalicio Activo</option>
              <option value="vitalicio-inactivo">Vitalicio Inactivo</option>
              <option value="regular-activo">Regular Activo</option>
              <option value="regular-inactivo">Regular Inactivo</option>
              <option value="pendiente">Pendiente</option>
              <option value="inactivo">Inactivo</option>
            </select>

            <select
              className="select-base"
              value={debtFilter}
              onChange={(e) => setDebtFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="al_dia">Al día</option>
              <option value="deudor">Deudores</option>
            </select>

            <button className="btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </motion.div>

        {/* Lista de socios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="neo-panel p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold font-[var(--font-space)]">Lista de Socios</h2>
            <p className="text-sm text-base-muted">{pagination.total} socios encontrados</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="neo-panel p-4 animate-pulse">
                  <div className="h-4 bg-base-border/40 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-base-border/40">
                    <th className="text-left p-3 text-xs uppercase tracking-[0.3em] text-base-muted">
                      Nombre
                    </th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.3em] text-base-muted">
                      DNI
                    </th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.3em] text-base-muted">
                      Estado
                    </th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.3em] text-base-muted">
                      Fecha de Inscripción
                    </th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.3em] text-base-muted">
                      Fecha de Cobertura
                    </th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.3em] text-base-muted">
                      Cuotas / Pagadas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-base-border/20 hover:bg-base-border/10 transition-colors"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{member.nombre}</p>
                          <p className="text-xs text-base-muted">{member.email}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{member.dni}</td>
                      <td className="p-3">
                        <span
                          className={`neo-tag text-xs ${
                            member.estadoCompleto === "Vitalicio Activo"
                              ? "bg-accent-primary/15 text-accent-primary"
                              : member.estadoCompleto === "Vitalicio Inactivo"
                                ? "bg-accent-primary/15 text-accent-primary/60"
                                : member.estadoCompleto === "Regular Activo"
                                  ? "bg-state-active/15 text-state-active"
                                  : member.estadoCompleto === "Regular Inactivo"
                                    ? "bg-accent-critical/15 text-accent-critical"
                                    : member.estadoCompleto === "Pendiente"
                                      ? "bg-accent-warning/15 text-accent-warning"
                                      : "bg-base-border/15 text-base-muted"
                          }`}
                        >
                          {member.estadoCompleto}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {member.fechaInscripcion
                          ? formatDateDDMMYYYY(member.fechaInscripcion)
                          : "Inexistente"}
                      </td>
                      <td className="p-3 text-sm">
                        {(() => {
                          if (!member.fechaCobertura) {
                            return "Inexistente";
                          } else if (member.fechaCobertura === "Vitalicio Activo") {
                            return "Vitalicio Activo";
                          } else if (member.fechaCobertura.includes("\nbaja")) {
                            const [fecha] = member.fechaCobertura.split("\nbaja");
                            return (
                              <div>
                                <div>{formatDateDDMMYYYY(fecha)}</div>
                                <div className="text-xs text-base-muted font-medium">baja</div>
                              </div>
                            );
                          } else {
                            return formatDateDDMMYYYY(member.fechaCobertura);
                          }
                        })()}
                      </td>
                      <td className="p-3 text-sm">
                        {member.fechaInscripcion
                          ? `${member.cuotasPagadas}/${member.cuotasPagadas + member.cuotasPendientes}`
                          : "Inexistente"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                className="btn-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </button>

              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`w-8 h-8 rounded text-sm ${
                      currentPage === page ? "btn-primary" : "btn-secondary"
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="btn-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
