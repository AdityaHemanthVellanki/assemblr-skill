import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/12 text-destructive border-destructive/20",
        outline: "border-border text-foreground",
        accent: "bg-[--accent-brand-muted] text-primary",
        success: "bg-[--success-muted] text-[--success]",
        warning: "bg-[--warning-muted] text-[--warning]",
        info: "bg-[--info-muted] text-[--info]",
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
  dot = false,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean; dot?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current shrink-0" />
      )}
      {props.children}
    </Comp>
  )
}

export { Badge, badgeVariants }
