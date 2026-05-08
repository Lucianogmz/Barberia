import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-lg border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-300 focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white border-slate-800",
        secondary:
          "bg-slate-100/80 text-slate-600 border-slate-200/50",
        destructive:
          "bg-red-50/80 text-red-600 border-red-200/50 focus-visible:ring-red-400/30",
        outline:
          "border-slate-200/60 text-slate-600 bg-white/80",
        ghost:
          "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
