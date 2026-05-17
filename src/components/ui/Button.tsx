import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-cyan-400 to-cyan-500 text-zinc-950 shadow-[0_8px_30px_-12px_rgba(34,211,238,0.6)] hover:from-cyan-300 hover:to-cyan-400",
  secondary:
    "bg-white/10 text-zinc-100 ring-1 ring-inset ring-white/10 hover:bg-white/15",
  ghost: "bg-transparent text-zinc-300 hover:bg-white/5",
  outline:
    "bg-transparent text-zinc-200 ring-1 ring-inset ring-white/15 hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
  icon: "h-10 w-10",
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
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
