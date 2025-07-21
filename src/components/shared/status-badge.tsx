import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/generated/prisma/enums";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  CONFIRMED: {
    label: "Confirmed",
    className:
      "bg-chart-1/15 text-chart-1 border border-chart-1/30",
  },
  PENDING: {
    label: "Pending",
    className:
      "bg-chart-4/15 text-chart-4 border border-chart-4/30",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border border-border",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-primary/10 text-primary border border-primary/20",
  },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      className={cn(
        "py-1 px-3 text-xs font-medium rounded-full",
        config.className
      )}
    >
      {config.label}
    </Badge>
  );
}
