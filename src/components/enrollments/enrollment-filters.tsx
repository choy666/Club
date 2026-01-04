"use client";

import { ENROLLMENT_STATUS_OPTIONS } from "@/constants/enrollment";
import { useEnrollmentFiltersStore } from "@/store/enrollment-filters-store";

export function EnrollmentFilters() {
  const { search, status, setSearch, setStatus } = useEnrollmentFiltersStore();

  return (
    <div className="neo-panel flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-1 flex-col gap-2">
        <label
          htmlFor="enrollment-search"
          className="text-xs uppercase tracking-[0.3em] text-base-muted"
        >
          Buscar inscripción
        </label>
        <input
          id="enrollment-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre, correo o documento"
          className="input-minimal w-full"
        />
      </div>
      <div className="flex flex-col gap-2 md:w-64">
        <label
          htmlFor="enrollment-status"
          className="text-xs uppercase tracking-[0.3em] text-base-muted"
        >
          Estado de inscripción
        </label>
        <select
          id="enrollment-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="select-base"
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
