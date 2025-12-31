"use client";

import { DUE_STATUS_OPTIONS } from "@/constants/enrollment";
import { useDueFiltersStore } from "@/store/due-filters-store";

export function DueFilters() {
  const {
    status,
    memberId,
    enrollmentId,
    from,
    to,
    setStatus,
    setMemberId,
    setEnrollmentId,
    setFrom,
    setTo,
  } = useDueFiltersStore();

  return (
    <div className="glass-card grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="due-status" className="text-sm text-base-muted">
          Estado de cuota
        </label>
        <select
          id="due-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="rounded-lg border border-base-border bg-base-secondary px-4 py-2 text-base-foreground focus:border-accent-primary focus:outline-none"
        >
          {DUE_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="due-member" className="text-sm text-base-muted">
          ID de socio
        </label>
        <input
          id="due-member"
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
          placeholder="ID del miembro"
          className="rounded-lg border border-base-border bg-transparent px-4 py-2 text-base-foreground placeholder:text-base-muted focus:border-accent-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="due-enrollment" className="text-sm text-base-muted">
          ID de inscripción
        </label>
        <input
          id="due-enrollment"
          value={enrollmentId}
          onChange={(event) => setEnrollmentId(event.target.value)}
          placeholder="ID de la inscripción"
          className="rounded-lg border border-base-border bg-transparent px-4 py-2 text-base-foreground placeholder:text-base-muted focus:border-accent-primary focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="due-from" className="text-sm text-base-muted">
            Desde
          </label>
          <input
            id="due-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-lg border border-base-border bg-transparent px-3 py-2 text-base-foreground focus:border-accent-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="due-to" className="text-sm text-base-muted">
            Hasta
          </label>
          <input
            id="due-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-lg border border-base-border bg-transparent px-3 py-2 text-base-foreground focus:border-accent-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
