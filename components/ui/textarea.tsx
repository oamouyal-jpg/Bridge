import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-bridge-mist/90 bg-white px-3 py-2 text-sm leading-relaxed text-bridge-ink shadow-bridge-inset transition-shadow placeholder:text-bridge-stone/55 focus-visible:border-bridge-sage/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridge-sage/25 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
