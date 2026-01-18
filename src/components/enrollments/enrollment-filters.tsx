"use client";

import { useState, useEffect } from "react";
import { ENROLLMENT_STATUS_OPTIONS } from "@/constants/enrollment";
import { useEnrollmentFiltersStore } from "@/store/enrollment-filters-store";

export function EnrollmentFilters() {
  const { search, status, setSearch, setStatus } = useEnrollmentFiltersStore();
  const [localSearch, setLocalSearch] = useState(search);

  // Sincronizar localSearch con search del store
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce para búsqueda automática
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
      }
    }, 300); // 300ms de debounce

    return () => clearTimeout(timeoutId);
  }, [localSearch, setSearch, search]);

  const handleClear = () => {
    setLocalSearch("");
    setSearch("");
  };

  return (
    <div className="neo-panel flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-1 flex-col gap-2 relative">
        <label
          htmlFor="enrollment-search"
          className="text-xs uppercase tracking-[0.3em] text-base-muted"
        >
          Buscar inscripción
        </label>
        <input
          id="enrollment-search"
          value={localSearch}
          onChange={(event) => setLocalSearch(event.target.value)}
          placeholder="Buscar por nombre o DNI"
          className="input-minimal w-full"
        />
        {localSearch && (
          <button
            className="absolute right-2 top-8 text-base-muted hover:text-base-foreground transition-colors"
            onClick={handleClear}
            type="button"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
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
