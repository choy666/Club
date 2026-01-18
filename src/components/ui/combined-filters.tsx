"use client";

import { SearchFilters } from "./search-filters";

interface FilterOption {
  value: string;
  label: string;
}

interface CombinedFiltersProps {
  // Búsqueda
  search: string;
  setSearch: (value: string) => void;
  searchPlaceholder?: string;
  searchDebounceMs?: number;
  searchLabel?: string;
  showClearButton?: boolean;
  disabled?: boolean;

  // Filtros adicionales
  filters?: Array<{
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  }>;

  // Botones
  showSearchButton?: boolean;
  searchButtonText?: string;
  onSearchButtonClick?: () => void;
  searchButtonLoading?: boolean;
  searchButtonDisabled?: boolean;

  // Layout
  className?: string;
  gridCols?: "1" | "2" | "3" | "4";
}

export function CombinedFilters({
  search,
  setSearch,
  searchPlaceholder = "Buscar por nombre, DNI o email...",
  searchDebounceMs = 300,
  searchLabel,
  showClearButton = true,
  disabled = false,
  filters = [],
  showSearchButton = false,
  searchButtonText = "Buscar",
  onSearchButtonClick,
  searchButtonLoading = false,
  searchButtonDisabled = false,
  className = "",
  gridCols = "4",
}: CombinedFiltersProps) {
  const gridColsClass = {
    "1": "grid-cols-1",
    "2": "grid-cols-1 md:grid-cols-2",
    "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[gridCols];

  return (
    <div className={`neo-panel p-6 space-y-4 ${className}`}>
      <div className={`grid gap-4 ${gridColsClass}`}>
        {/* Input de búsqueda */}
        <div className={filters.length > 0 ? "col-span-1" : "col-span-full"}>
          {searchLabel && (
            <label
              htmlFor="combined-search"
              className="text-xs uppercase tracking-[0.3em] text-base-muted block mb-2"
            >
              {searchLabel}
            </label>
          )}
          <SearchFilters
            id={searchLabel ? "combined-search" : undefined}
            search={search}
            setSearch={setSearch}
            placeholder={searchPlaceholder}
            debounceMs={searchDebounceMs}
            showClearButton={showClearButton}
            disabled={disabled}
          />
        </div>

        {/* Filtros adicionales */}
        {filters.map((filter) => (
          <div key={filter.id} className={filter.className || ""}>
            <label
              htmlFor={filter.id}
              className="text-xs uppercase tracking-[0.3em] text-base-muted block mb-2"
            >
              {filter.label}
            </label>
            <select
              id={filter.id}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="select-base w-full"
              disabled={disabled}
            >
              {filter.placeholder && <option value="">{filter.placeholder}</option>}
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Botón de búsqueda */}
        {showSearchButton && (
          <button
            className="btn-primary"
            onClick={onSearchButtonClick}
            disabled={disabled || searchButtonDisabled || searchButtonLoading}
          >
            {searchButtonLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Buscando...
              </span>
            ) : (
              searchButtonText
            )}
          </button>
        )}
      </div>
    </div>
  );
}
