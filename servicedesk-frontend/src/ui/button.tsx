import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClass: Record<ButtonVariant, string> = {
  default:
    "border border-slate-900 bg-slate-900 text-white shadow-sm hover:bg-slate-800",
  outline:
    "border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50",
  secondary:
    "border border-slate-100 bg-slate-100 text-slate-900 hover:bg-slate-200",
  ghost: "border border-transparent bg-transparent text-slate-700 hover:bg-slate-100",
  danger:
    "border border-rose-600 bg-rose-600 text-white shadow-sm hover:bg-rose-700",
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
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
