"use client";

import { useMemberFiltersStore } from "@/store/members-filters-store";
import { MEMBER_STATUS_OPTIONS } from "@/constants/member";

export function MemberFilters() {
  const { search, status, setSearch, setStatus } = useMemberFiltersStore();

  return (
    <div className="glass-card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor="member-search" className="text-sm text-base-muted">
          Buscar socio
        </label>
        <input
          id="member-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre, correo o documento"
          className="w-full rounded-lg border border-base-border bg-transparent px-4 py-2 text-base-foreground placeholder:text-base-muted focus:border-accent-primary focus:outline-none"
        />
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
