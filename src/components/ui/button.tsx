import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const variantStyles = {
      default: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/20",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20",
      outline: "border border-emerald-600/20 bg-white text-emerald-800 hover:bg-emerald-50 hover:border-emerald-600/40",
      secondary: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-100",
      ghost: "text-emerald-800 hover:bg-emerald-50/80",
      link: "text-emerald-600 underline-offset-4 hover:underline p-0 h-auto",
    }[variant]

    const sizeStyles = {
      default: "h-11 px-5 py-2.5",
      sm: "h-9 px-3 text-xs",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10 p-0",
    }[size]

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
