"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

interface OptimizedScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

export const OptimizedScrollArea = forwardRef<HTMLDivElement, OptimizedScrollAreaProps>(
  ({ children, className = "", onScroll, ...props }, ref) => {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const internalRef = useRef<HTMLDivElement>(null);
    const scrollRef = (ref || internalRef) as React.RefObject<HTMLDivElement>;

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      setIsScrolling(true);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      if (onScroll) {
        onScroll(event);
      }
    };

    useEffect(() => {
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={scrollRef}
        className={`optimized-scroll-area ${isScrolling ? 'scrolling' : ''} ${className}`}
        onScroll={handleScroll}
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

OptimizedScrollArea.displayName = "OptimizedScrollArea";
