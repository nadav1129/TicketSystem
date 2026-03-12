import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info";

const variantClass: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-900",
  secondary: "bg-zinc-800 text-zinc-200",
  outline: "border border-zinc-600 bg-zinc-900 text-zinc-200",
  success: "bg-emerald-500/20 text-emerald-300",
  warning: "bg-amber-500/20 text-amber-300",
  danger: "bg-rose-500/20 text-rose-300",
  info: "bg-sky-500/20 text-sky-300",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
