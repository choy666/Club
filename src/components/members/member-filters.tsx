"use client";

import { useState, useEffect } from "react";
import { useMemberFiltersStore } from "@/store/members-filters-store";
import { MEMBER_STATUS_OPTIONS } from "@/constants/member";

export function MemberFilters() {
  const { search, status, setSearch, setStatus } = useMemberFiltersStore();
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
    <div className="glass-card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2 relative">
        <label htmlFor="member-search" className="text-sm text-base-muted">
          Buscar socio
        </label>
        <input
          id="member-search"
          value={localSearch}
          onChange={(event) => setLocalSearch(event.target.value)}
          placeholder="Buscar por nombre o DNI"
          className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 text-base-foreground placeholder:text-base-muted focus:border-accent-primary focus:outline-none"
        />
        {localSearch && (
          <button
            className="absolute right-3 top-8 text-base-muted hover:text-base-foreground transition-colors"
            onClick={handleClear}
            type="button"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2 md:w-64">
        <label htmlFor="member-status" className="text-sm text-base-muted">
          Estado
        </label>
        <select
          id="member-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="select-base"
        >
          <option value="ALL">Todos</option>
          {MEMBER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
