import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 outline-none select-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-slate-900 to-black text-white shadow-lg shadow-black/20 hover:from-slate-800 hover:to-black hover:shadow-xl hover:shadow-black/30 active:from-slate-950 active:to-slate-900 border border-white/10 ring-1 ring-inset ring-white/5",
        outline:
          "border border-slate-200/60 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-300",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/50",
        ghost:
          "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200",
        destructive:
          "bg-gradient-to-b from-red-500/90 to-red-600 text-white shadow-sm shadow-red-500/20 hover:from-red-500 hover:to-red-700 border border-red-400/20",
        link: "text-slate-600 underline-offset-4 hover:underline hover:text-slate-900",
      },
      size: {
        default:
          "h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 text-base",
        icon: "size-10 rounded-xl",
        "icon-xs":
          "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
