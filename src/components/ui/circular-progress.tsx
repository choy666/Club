"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  color?: string;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  children,
  color = "rgb(59, 130, 246)", // blue-500
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Background circle */}
      <svg className="absolute inset-0 transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(229, 231, 235)" // gray-200
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          strokeLinecap="round"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            <span className="text-lg font-semibold text-gray-900">{Math.round(value)}%</span>
            <span className="text-xs text-gray-500">completado</span>
          </>
        )}
      </div>
    </div>
  );
}

interface DuesProgressProps {
  paid: number;
  total: number;
  size?: number;
  className?: string;
}

export function DuesProgress({ paid, total, size = 120, className }: DuesProgressProps) {
  const percentage = total > 0 ? (paid / total) * 100 : 0;

  return (
    <CircularProgress
      value={percentage}
      size={size}
      className={className}
      color={percentage >= 100 ? "rgb(34, 197, 94)" : "rgb(59, 130, 246)"} // green-500 : blue-500
    >
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">
          {paid}/{total}
        </div>
        <div className="text-xs text-gray-500">cuotas</div>
      </div>
    </CircularProgress>
  );
}
