"use client";

import { memo, ReactNode } from "react";

interface ModalSectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const ModalSection = memo(({ children, className = "", title, description }: ModalSectionProps) => {
  return (
    <div className={`modal-section ${className}`} style={{ contain: 'layout style paint' }}>
      {title && (
        <div className="modal-section-header">
          <h4 className="modal-section-title">{title}</h4>
          {description && (
            <p className="modal-section-description">{description}</p>
          )}
        </div>
      )}
      <div className="modal-section-content">
        {children}
      </div>
    </div>
  );
});

ModalSection.displayName = "ModalSection";

interface ModalLoadingProps {
  message?: string;
}

export const ModalLoading = memo(({ message = "Cargando..." }: ModalLoadingProps) => {
  return (
    <div className="modal-loading">
      <div className="modal-loading-spinner" />
      <p className="modal-loading-text">{message}</p>
    </div>
  );
});

ModalLoading.displayName = "ModalLoading";
