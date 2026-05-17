"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 active:bg-emerald-600",
      secondary: "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:text-zinc-50",
      ghost: "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800",
      danger: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-7 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
