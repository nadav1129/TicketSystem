import type { TextareaHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500",
        className,
      )}
      {...props}
    />
  );
}
