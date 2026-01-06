"use client";

import { DUE_STATUS_OPTIONS } from "@/constants/enrollment";
import { useDueFiltersStore } from "@/store/due-filters-store";

export function DueFilters() {
  const { search, status, setSearch, setStatus } = useDueFiltersStore();

  return (
    <div className="neo-panel flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-1 flex-col gap-2">
        <label
          htmlFor="due-search"
          className="text-xs uppercase tracking-[0.3em] text-base-muted"
        >
          Buscar cuota
        </label>
        <input
          id="due-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre, correo o documento"
          className="input-minimal w-full"
        />
      </div>
      <div className="flex flex-col gap-2 md:w-64">
        <label
          htmlFor="due-status"
          className="text-xs uppercase tracking-[0.3em] text-base-muted"
        >
          Estado de cuota
        </label>
        <select
          id="due-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="select-base"
        >
          {DUE_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
