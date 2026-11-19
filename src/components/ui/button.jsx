import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-cta text-cta-foreground shadow-[0_10px_22px_rgba(194,65,12,0.22)] hover:bg-cta-dark hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-bordeaux/35 bg-papier text-bordeaux shadow-sm hover:bg-bordeaux/5",
        secondary:
          "bg-papier text-bordeaux border border-bordeaux/20 shadow-sm hover:bg-bordeaux/5",
        ghost: "text-bordeaux hover:bg-bordeaux/5",
        link: "text-bordeaux underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[44px] px-4 py-2",
        sm: "min-h-[38px] rounded-md px-3 text-xs",
        lg: "min-h-[48px] rounded-lg px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }