import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

type TabsContextType = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

type TabsProps = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
};

export function Tabs({
  defaultValue = "",
  value,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  const setValue = (next: string) => {
    if (value == null) setInternalValue(next);
    onValueChange?.(next);
  };

  const context = useMemo(() => ({ value: currentValue, setValue }), [currentValue]);

  return (
    <TabsContext.Provider value={context}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("inline-flex h-9 items-center rounded-md border border-zinc-800 bg-zinc-950 p-1", className)}
      {...props}
    />
  );
}

type TabsTriggerProps = HTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) return null;

  const active = context.value === value;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-sm px-3 py-1 text-xs font-medium transition",
        active
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:text-zinc-200",
        className,
      )}
      onClick={() => context.setValue(value)}
      {...props}
    />
  );
}

type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
};

export function TabsContent({ className, value, ...props }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context || context.value !== value) return null;
  return <div className={cn("outline-none", className)} {...props} />;
}
