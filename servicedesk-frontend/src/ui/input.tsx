import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500",
        className,
      )}
      {...props}
    />
  );
}
