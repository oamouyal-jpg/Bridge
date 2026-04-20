import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-bridge-mist/90 bg-white px-3 py-2 text-sm text-bridge-ink shadow-bridge-inset transition-shadow placeholder:text-bridge-stone/55 focus-visible:border-bridge-sage/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridge-sage/25 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
