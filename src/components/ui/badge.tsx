import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-primary/20 bg-primary/10 text-primary",
  muted: "border-border bg-muted text-muted-foreground",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
