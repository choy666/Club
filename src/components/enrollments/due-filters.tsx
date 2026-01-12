"use client";

import { useDueFiltersStore } from "@/store/due-filters-store";

export function DueFilters() {
  const { search, setSearch } = useDueFiltersStore();

  return (
    <div className="neo-panel flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor="due-search" className="text-xs uppercase tracking-[0.3em] text-base-muted">
          Buscar socio
        </label>
        <input
          id="due-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre, correo o DNI"
          className="input-minimal w-full"
        />
      </div>
    </div>
  );
}
