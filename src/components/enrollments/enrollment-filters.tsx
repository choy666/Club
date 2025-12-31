"use client";

import { ENROLLMENT_STATUS_OPTIONS } from "@/constants/enrollment";
import { useEnrollmentFiltersStore } from "@/store/enrollment-filters-store";

export function EnrollmentFilters() {
  const { search, status, setSearch, setStatus } = useEnrollmentFiltersStore();

  return (
    <div className="glass-card flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor="enrollment-search" className="text-sm text-base-muted">
          Buscar inscripción
        </label>
        <input
          id="enrollment-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre, correo o documento"
          className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 text-base-foreground placeholder:text-base-muted focus:border-accent-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2 md:w-64">
        <label htmlFor="enrollment-status" className="text-sm text-base-muted">
          Estado de inscripción
        </label>
        <select
          id="enrollment-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="rounded-lg border border-base-border bg-base-secondary px-4 py-2 text-base-foreground focus:border-accent-primary focus:outline-none"
        >
          {ENROLLMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
