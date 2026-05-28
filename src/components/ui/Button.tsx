"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "danger" | "subtle";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const styles: Record<Variant, string> = {
  primary: "bg-accent text-[#0a1530] hover:bg-accent-glow",
  ghost:
    "border border-line-soft bg-bg-soft/40 text-ink-soft hover:text-ink hover:border-line",
  subtle: "text-ink-soft hover:text-ink",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "ghost", size = "md", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:scale-100",
        styles[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  );
});
