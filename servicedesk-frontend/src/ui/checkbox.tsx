import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 appearance-none rounded-[4px] border border-zinc-700 bg-zinc-950 checked:border-emerald-500 checked:bg-emerald-500/80 focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-0",
          className,
        )}
        {...props}
      />
    );
  },
);

Checkbox.displayName = "Checkbox";
