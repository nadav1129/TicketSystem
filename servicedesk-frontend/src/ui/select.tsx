import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400",
        className,
      )}
      {...props}
    />
  );
}
