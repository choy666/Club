"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, open, onClose, children }: ModalProps) {
  const [mounted] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="glass-card max-h-[90vh] w-full max-w-xl overflow-hidden border border-base-border shadow-2xl">
        <header className="flex items-center justify-between border-b border-base-border px-6 py-4">
          <h3 className="text-lg font-semibold font-[var(--font-space)]">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-base-muted hover:text-base-foreground transition-colors"
          >
            ✕
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
