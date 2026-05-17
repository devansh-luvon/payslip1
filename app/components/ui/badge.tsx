import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-zinc-800 text-zinc-300",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  muted: "bg-zinc-800/60 text-zinc-500",
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Map payroll/milestone status strings to badge variants */
export function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "PAID":
      return "success";
    case "DRAFT":
    case "LOCKED":
    case "PENDING_SUBMISSION":
      return "muted";
    case "SUBMITTED":
    case "PENDING":
      return "warning";
    case "REJECTED":
    case "FROZEN":
      return "danger";
    case "COMPLETED":
      return "info";
    default:
      return "default";
  }
}
