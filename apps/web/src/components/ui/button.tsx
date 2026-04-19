import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border border-transparent bg-clip-padding font-bold text-[0.95rem] leading-5 outline-none transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:nrc-focus-ring",
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
          "nrc-pill bg-[linear-gradient(135deg,#447aff_0%,#7a5af8_100%)] text-white shadow-[rgba(41,41,41,0.26)_0px_10px_20px_-10px] hover:-translate-y-0.5 hover:shadow-[rgba(41,41,41,0.3)_0px_18px_28px_-16px]",
        destructive:
          "nrc-pill bg-[#fff0f9] text-[#ee46bc] hover:-translate-y-0.5 hover:bg-[#ffd8f1]",
        ghost: "nrc-pill text-[#172b4d] hover:-translate-y-0.5 hover:bg-[#eef3ff]",
        link: "rounded-none px-0 py-0 text-[#447aff] underline-offset-4 hover:underline",
        outline:
          "nrc-pill border-[#447aff] bg-transparent text-[#447aff] hover:-translate-y-0.5 hover:bg-[rgb(68_122_255_/_0.05)]",
        secondary:
          "nrc-pill bg-white text-[#172b4d] shadow-[rgb(0_0_0_/_0.05)_0px_4px_6px_-1px] hover:-translate-y-0.5 hover:bg-[#f7f9fc]",
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
