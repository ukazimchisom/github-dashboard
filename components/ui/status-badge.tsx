import { getPRStatusColor, getPRStatusLabel } from "@/lib/utils/pr-helpers";
import { cn } from "@/lib/utils/cn";
import type { PR_STATUS_TYPE } from "@/config/constants";

type StatusBadgeProps = {
  status: PR_STATUS_TYPE;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = getPRStatusColor(status);
  const label = getPRStatusLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        colors.bg,
        colors.text,
        className,
      )}
    >
      {/* Colored dot */}
      <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
      {label}
    </span>
  );
}
