"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({ title, open, onClose, children, maxWidth = "xl" }: ModalProps) {
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop con animación */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
            scale: { type: "spring", stiffness: 300, damping: 25 },
          }}
          className={`relative w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-hidden`}
        >
          {/* Glass Card con efectos mejorados */}
          <div className="neo-modal-glass">
            {/* Header optimizado */}
            <header className="neo-modal-header">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-primary to-accent-primary/60" />
                <h3 className="neo-modal-title">{title}</h3>
              </div>
              <button onClick={onClose} aria-label="Cerrar modal" className="neo-modal-close">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </header>

            {/* Content con scroll optimizado */}
            <div className="neo-modal-content">{children}</div>
          </div>

          {/* Efectos decorativos */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
