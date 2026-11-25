import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#014421] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[#014421] text-white shadow-sm hover:bg-[#013220] active:scale-[0.99]",
        secondary:
          "bg-[#355E3B] text-white shadow-sm hover:bg-[#014421] active:scale-[0.99]",
        outline:
          "border border-[#013220]/25 bg-white text-[#013220] hover:bg-[#E8F0E8] hover:border-[#014421]",
        ghost:
          "text-[#013220] hover:bg-[#E8F0E8]",
        cream:
          "bg-[#F7F8F4] text-[#013220] border border-[#013220]/15 hover:bg-[#E8F0E8]",
        whatsapp:
          "bg-[#014421] text-white shadow-sm hover:bg-[#013220] ring-1 ring-white/15",
      },
      size: {
        sm: "h-10 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
