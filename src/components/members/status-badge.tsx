import type { MemberStatus } from "@/types/member";

const STATUS_STYLES: Record<
  MemberStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Activo",
    className: "text-state-active bg-state-active/10 border-state-active/40",
  },
  INACTIVE: {
    label: "Inactivo",
    className:
      "text-state-inactive bg-state-inactive/10 border-state-inactive/30",
  },
  PENDING: {
    label: "Pendiente",
    className: "text-state-pending bg-state-pending/10 border-state-pending/30",
  },
};

interface StatusBadgeProps {
  status: MemberStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${styles.className}`}
    >
      {styles.label}
    </span>
  );
}
