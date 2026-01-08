"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  useEffect(() => {
    if (!open) return;

    window.addEventListener("keydown", handleKeyDown);
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (contentElement) {
        contentElement.removeEventListener("scroll", handleScroll);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [open, handleKeyDown, handleScroll]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop optimizado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          onClick={handleBackdropClick}
          style={{ willChange: "opacity" }}
        />

        {/* Modal Container optimizado */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
          className={`relative w-full ${maxWidthClasses[maxWidth]} max-h-[85vh] overflow-hidden`}
          style={{ willChange: "transform, opacity" }}
        >
          {/* Glass Card optimizado */}
          <div className="neo-modal-glass">
            {/* Header optimizado */}
            <header className="neo-modal-header">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-primary to-accent-primary/60" />
                <h3 className="neo-modal-title">{title}</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar modal"
                className="neo-modal-close"
                type="button"
              >
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
            <div
              ref={contentRef}
              className={`neo-modal-content ${isScrolling ? "scrolling" : ""}`}
              style={{
                scrollBehavior: "smooth",
                overflowY: "auto",
                overscrollBehavior: "contain",
              }}
            >
              {children}
            </div>
          </div>

          {/* Efectos decorativos optimizados */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary/3 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
