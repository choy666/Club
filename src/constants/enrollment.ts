import type { DueStatus, EnrollmentStatus } from "@/types/enrollment";

export const ENROLLMENT_STATUS_OPTIONS: {
  value: EnrollmentStatus | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Activa" },
  { value: "CANCELLED", label: "Cancelada" },
];

export const DUE_STATUS_OPTIONS: { value: DueStatus | "ALL"; label: string }[] =
  [
    { value: "ALL", label: "Todas" },
    { value: "PENDING", label: "Pendiente" },
    { value: "PAID", label: "Pagada" },
    { value: "OVERDUE", label: "Vencida" },
    { value: "FROZEN", label: "Congelada" },
  ];
