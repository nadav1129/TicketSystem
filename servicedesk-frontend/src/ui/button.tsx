import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClass: Record<ButtonVariant, string> = {
  default:
    "border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-sm hover:bg-zinc-800",
  outline:
    "border border-zinc-700 bg-zinc-950 text-zinc-200 shadow-xs hover:bg-zinc-900",
  secondary:
    "border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800",
  ghost: "border border-transparent bg-transparent text-zinc-300 hover:bg-zinc-900",
  danger:
    "border border-rose-700 bg-rose-700 text-white shadow-sm hover:bg-rose-600",
};

const sizeClass: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-9 px-3 text-xs",
  lg: "h-11 px-5 text-sm",
  icon: "h-10 w-10",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
