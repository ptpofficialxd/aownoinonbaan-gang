import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 text-slate-950 shadow-[0_18px_50px_-20px_rgba(56,189,248,0.9)] hover:brightness-105",
  secondary:
    "bg-white/10 text-zinc-100 ring-1 ring-inset ring-white/10 hover:bg-white/15",
  ghost: "bg-transparent text-zinc-300 hover:bg-white/6 hover:text-white",
  outline:
    "bg-transparent text-zinc-100 ring-1 ring-inset ring-white/15 hover:bg-white/6",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
