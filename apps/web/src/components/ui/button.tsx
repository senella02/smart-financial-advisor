import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[6px] text-base leading-normal font-medium transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[#293E91] active:bg-[#213273]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border border-[#75819B] bg-card text-foreground hover:bg-[#E9EDFB] hover:text-primary",
        secondary:
          "border border-[#75819B] bg-[#E9EDFB] text-primary hover:bg-[#DCE3FA]",
        ghost:
          "hover:bg-[#E9EDFB] hover:text-primary",
        link: "text-primary underline underline-offset-4 hover:text-[#293E91]",
      },
      size: {
        default: "min-h-11 min-w-11 px-4 py-2.5",
        xs: "min-h-8 gap-1 rounded-[6px] px-2.5 text-sm",
        sm: "min-h-11 gap-1.5 rounded-[6px] px-3.5 py-2",
        lg: "min-h-11 rounded-[6px] px-6 py-2.5",
        icon: "size-11",
        "icon-xs": "size-8 rounded-[6px]",
        "icon-sm": "size-11",
        "icon-lg": "size-11",
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
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
