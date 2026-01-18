"use client";

import { useState, useEffect } from "react";

interface SearchFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  showClearButton?: boolean;
  disabled?: boolean;
  id?: string;
}

export function SearchFilters({
  search,
  setSearch,
  placeholder = "Buscar por nombre, DNI o email...",
  debounceMs = 300,
  className = "",
  showClearButton = true,
  disabled = false,
  id,
}: SearchFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);

  // Sincronizar localSearch con search prop
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce para búsqueda automática
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [localSearch, setSearch, search, debounceMs]);

  const handleClear = () => {
    setLocalSearch("");
    setSearch("");
  };

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        className={`input-minimal w-full ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        disabled={disabled}
      />
      {showClearButton && localSearch && !disabled && (
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-muted hover:text-base-foreground transition-colors"
          onClick={handleClear}
          type="button"
          title="Limpiar búsqueda"
        >
          ✕
        </button>
      )}
    </div>
  );
}
