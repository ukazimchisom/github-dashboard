// A reusable Button with variants (primary, secondary, ghost, destructive)
// and sizes (sm, md, lg).
//
// Usage:
//   <Button variant="primary" size="sm">Click me</Button>
//   <Button variant="ghost" isLoading>Saving...</Button>

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

// Variant styles — defined outside component so they don't recreate on render
const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-gray-900 text-white hover:bg-gray-700 disabled:bg-gray-300",
  secondary:
    "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 disabled:opacity-50",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 disabled:opacity-50",
  destructive: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        // Base styles applied to all buttons
        "inline-flex items-center justify-center gap-2",
        "font-medium rounded-lg",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900",
        "disabled:cursor-not-allowed",
        // Variant and size
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
