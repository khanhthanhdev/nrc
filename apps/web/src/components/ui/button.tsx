import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border bg-clip-padding font-medium text-[0.95rem] leading-5 outline-none transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:nrc-focus-ring",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "min-h-11 px-6 py-3",
        icon: "size-11",
        "icon-lg": "size-12",
        "icon-sm": "size-9",
        "icon-xs": "size-8",
        lg: "min-h-12 px-7 py-3.5",
        sm: "min-h-10 px-5 py-2.5 text-sm",
        xs: "min-h-8 px-3 py-2 text-xs",
      },
      variant: {
        default:
          "rounded-[var(--dt-radius-sm)] border-primary bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-surface-strong hover:text-primary focus-visible:shadow-none",
        destructive:
          "rounded-[var(--dt-radius-sm)] border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15",
        ghost:
          "rounded-[var(--dt-radius-sm)] border-transparent text-foreground hover:bg-accent hover:text-primary",
        link: "rounded-none border-transparent px-0 py-0 text-primary underline-offset-4 hover:underline",
        outline:
          "rounded-[var(--dt-radius-sm)] border-[color:var(--dt-color-gray-300)] bg-card text-foreground hover:-translate-y-0.5 hover:border-primary hover:text-primary",
        secondary:
          "rounded-[var(--dt-radius-sm)] border-[color:var(--dt-color-gray-300)] bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:border-primary hover:text-primary",
      },
    },
  },
);

const Button = ({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) => {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  );
};

export { Button, buttonVariants };
