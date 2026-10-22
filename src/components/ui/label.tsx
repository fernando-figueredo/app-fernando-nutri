import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-xs font-semibold text-slate-700 tracking-wide select-none flex items-center gap-1",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-emerald-600">*</span>}
    </label>
  )
)
Label.displayName = "Label"

export { Label }
