"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "dark" | "ghost" | "danger";
export function Button({ variant="primary", loading=false, children, className="", disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; children: ReactNode }) {
  const styles = {
    primary: "bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-lg shadow-cyan-500/15",
    secondary: "bg-white text-slate-950 border border-slate-200 hover:bg-slate-50",
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };
  return <button disabled={disabled || loading} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{children}</button>;
}
