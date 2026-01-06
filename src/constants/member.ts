import type { MemberStatus } from "@/types/member";

export const MEMBER_STATUS_OPTIONS: { value: MemberStatus; label: string }[] = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "PENDING", label: "Pendiente" },
  { value: "VITALICIO", label: "Vitalicio" },
];
