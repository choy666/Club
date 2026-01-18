import React from "react";

interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface PaginationControlsProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  showPerPageSelector?: boolean;
  itemType?: string;
}

export function PaginationControls({
  pagination,
  onPageChange,
  onPerPageChange,
  showPerPageSelector = false,
  itemType = "items",
}: PaginationControlsProps) {
  const { page, perPage, total, totalPages } = pagination;

  const handlePreviousPage = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const handlePageClick = (pageNum: number) => {
    onPageChange(pageNum);
  };

  // Generar números de página con elipsis inteligentes
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      // Mostrar todas las páginas si hay 7 o menos
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (page <= 3) {
        // Inicio: 1,2,3,4,...,last
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        // Final: 1,...,last-3,last-2,last-1,last
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Medio: 1,...,current-1,current,current+1,...,last
        pages.push(1);
        pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col gap-4 border-t border-base-border px-6 py-4 text-sm text-base-muted md:flex-row md:items-center md:justify-between">
      {/* Información de paginación */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <span className="text-center md:text-left">
          {total === 0 ? (
            <span className="font-medium">No hay {itemType} para mostrar</span>
          ) : (
            <span className="font-medium">
              Página {page} de {totalPages}
            </span>
          )}
        </span>
        {showPerPageSelector && onPerPageChange && (
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <label className="text-xs">Items:</label>
            <select
              value={perPage}
              onChange={(e) => {
                onPerPageChange(Number(e.target.value));
              }}
              className="select-base text-xs w-auto"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2 justify-center md:justify-end">
        <button
          className="btn-secondary px-3 py-1 text-xs flex items-center gap-1"
          onClick={handlePreviousPage}
          disabled={page === 1}
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Anterior
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) => (
            <span key={index}>
              {pageNum === "..." ? (
                <span className="px-2 py-1 text-xs text-base-muted">...</span>
              ) : (
                <button
                  onClick={() => handlePageClick(pageNum as number)}
                  className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                    pageNum === page
                      ? "bg-accent-primary text-white"
                      : "text-base-muted hover:bg-base-card hover:text-base-foreground"
                  }`}
                >
                  {pageNum}
                </button>
              )}
            </span>
          ))}
        </div>

        <button
          className="btn-secondary px-3 py-1 text-xs flex items-center gap-1"
          onClick={handleNextPage}
          disabled={page >= totalPages}
        >
          Siguiente
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
