import * as React from "react";
import { cn } from "../../lib/utils";

const Button = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  type = "button",
  children,
  ...props 
}, ref) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "outline" && "border border-input hover:bg-accent hover:text-accent-foreground",
        size === "default" && "h-10 py-2 px-4",
        size === "sm" && "h-9 px-3 rounded-md",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";

export { Button };