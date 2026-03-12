import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-500",
        className,
      )}
      {...props}
    />
  );
}
