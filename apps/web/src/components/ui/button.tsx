"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm border font-normal text-base leading-6 outline-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-sm)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:border-border disabled:bg-border disabled:text-muted-foreground disabled:opacity-100 data-loading:select-none data-loading:text-transparent [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 px-4",
        icon: "size-10 rounded-full",
        "icon-lg": "size-11 rounded-full",
        "icon-sm": "size-9 rounded-full",
        "icon-xl":
          "size-12 rounded-full [&_svg:not([class*='size-'])]:size-5",
        "icon-xs":
          "size-8 rounded-full not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4",
        lg: "h-11 px-5",
        sm: "h-8 gap-1.5 px-3 text-sm",
        xl: "h-12 px-6 text-lg [&_svg:not([class*='size-'])]:size-5",
        xs: "h-7 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
      },
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground hover:bg-info data-pressed:bg-info *:data-[slot=button-loading-indicator]:text-primary-foreground",
        destructive:
          "border-destructive bg-destructive text-white hover:bg-destructive/90 data-pressed:bg-destructive/90 *:data-[slot=button-loading-indicator]:text-white",
        "destructive-outline":
          "border-destructive bg-background text-destructive hover:bg-destructive/4 data-pressed:bg-destructive/4 *:data-[slot=button-loading-indicator]:text-foreground",
        ghost:
          "rounded-none border-transparent bg-transparent px-0 font-bold text-foreground hover:bg-transparent hover:text-primary hover:underline data-pressed:text-primary data-pressed:underline *:data-[slot=button-loading-indicator]:text-foreground",
        link: "rounded-none border-transparent bg-transparent px-0 font-medium text-primary underline-offset-4 hover:underline data-pressed:underline *:data-[slot=button-loading-indicator]:text-foreground",
        outline:
          "border-foreground bg-transparent font-medium text-foreground hover:bg-muted data-pressed:bg-accent *:data-[slot=button-loading-indicator]:text-foreground",
        secondary:
          "border-primary/20 bg-secondary text-secondary-foreground hover:bg-surface-strong data-pressed:bg-surface-strong *:data-[slot=button-loading-indicator]:text-secondary-foreground",
      },
    },
  },
);

export interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  loading?: boolean;
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  render,
  children,
  loading = false,
  disabled: disabledProp,
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled = Boolean(loading || disabledProp);
  const renderProp = asChild ? <Slot.Root /> : render;
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render || asChild ? undefined : "button";

  const defaultProps = {
    children: (
      <>
        {children}
        {loading && (
          <Spinner className="pointer-events-none absolute" data-slot="button-loading-indicator" />
        )}
      </>
    ),
    className: cn(buttonVariants({ className, size, variant })),
    "aria-disabled": loading || undefined,
    "data-loading": loading ? "" : undefined,
    "data-slot": "button",
    disabled: isDisabled,
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render: renderProp,
  });
}
