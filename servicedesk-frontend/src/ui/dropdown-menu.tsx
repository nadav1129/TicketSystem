import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  HTMLAttributes,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
} from "react";
import { cn } from "../lib/utils";

type DropdownMenuContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

type DropdownMenuProps = {
  children: ReactNode;
};

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

type DropdownMenuTriggerProps = {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
};

export function DropdownMenuTrigger({
  children,
  className,
  asChild = false,
}: DropdownMenuTriggerProps) {
  const context = useContext(DropdownMenuContext);
  if (!context) return null;

  const handleClick = (event?: ReactMouseEvent<HTMLElement>) => {
    if (event?.defaultPrevented) {
      return;
    }

    context.setOpen(!context.open);
  };

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string;
      onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
      "aria-expanded"?: boolean;
      "aria-haspopup"?: "menu";
    }>;

    return cloneElement(child, {
      className: cn(child.props.className, className),
      onClick: (event: ReactMouseEvent<HTMLElement>) => {
        child.props.onClick?.(event);
        handleClick(event);
      },
      "aria-expanded": context.open,
      "aria-haspopup": "menu",
    });
  }

  return (
    <button
      type="button"
      onClick={(event) => handleClick(event)}
      className={cn(className)}
      aria-expanded={context.open}
      aria-haspopup="menu"
    >
      {children}
    </button>
  );
}

type DropdownMenuContentProps = HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end";
};

export function DropdownMenuContent({
  className,
  align = "start",
  ...props
}: DropdownMenuContentProps) {
  const context = useContext(DropdownMenuContext);
  if (!context?.open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-44 rounded-md border border-zinc-800 bg-zinc-950 p-1 shadow-xl",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
      {...props}
    />
  );
}

type DropdownMenuItemProps = HTMLAttributes<HTMLButtonElement> & {
  onSelect?: () => void;
};

export function DropdownMenuItem({
  className,
  children,
  onSelect,
  ...props
}: DropdownMenuItemProps) {
  const context = useContext(DropdownMenuContext);

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-800",
        className,
      )}
      onClick={() => {
        onSelect?.();
        context?.setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

type DropdownMenuCheckboxItemProps = Omit<DropdownMenuItemProps, "onSelect"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function DropdownMenuCheckboxItem({
  checked,
  onCheckedChange,
  className,
  children,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-800",
        className,
      )}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span
        className={cn(
          "inline-flex h-4 w-4 items-center justify-center rounded-[4px] border text-[11px]",
          checked
            ? "border-emerald-500 bg-emerald-500/80 text-zinc-950"
            : "border-zinc-700 bg-zinc-900 text-transparent",
        )}
      >
        ✓
      </span>
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("my-1 h-px bg-zinc-800", className)} {...props} />;
}
