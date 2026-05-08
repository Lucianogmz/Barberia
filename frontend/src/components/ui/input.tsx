import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 transition-all duration-300 outline-none placeholder:text-slate-400/60 focus-visible:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-200/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50/50 disabled:opacity-60 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-200/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
