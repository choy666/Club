"use client";

import { DuesProgress } from "@/components/ui/circular-progress";
import type { MemberSummary } from "@/components/enrollments/due-table";

interface MemberProgressSummaryProps {
  memberSummary: MemberSummary;
}

export function MemberProgressSummary({ memberSummary }: MemberProgressSummaryProps) {
  const totalDues = memberSummary.dues.length;
  const paidDues = memberSummary.paidCount;
  const percentage = totalDues > 0 ? Math.round((paidDues / totalDues) * 100) : 0;

  // Si no hay cuotas, mostrar mensaje claro
  if (totalDues === 0) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <div className="w-32 h-32 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Sin cuotas</span>
          </div>
          <p className="text-sm text-gray-600 mt-4">Este socio no tiene una inscripción activa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <DuesProgress paid={paidDues} total={totalDues} size={140} />
      <div className="text-center">
        <p className="text-sm text-gray-600">{percentage}% hacia socio vitalicio</p>
      </div>
    </div>
  );
}
