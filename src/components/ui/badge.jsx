import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "bordero-badge transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-bordeaux/10 text-bordeaux border-bordeaux/25",
        secondary:
          "bg-sepia/15 text-bois border-sepia/35",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/30",
        outline: "bg-transparent text-bordeaux border-bordeaux/35",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }