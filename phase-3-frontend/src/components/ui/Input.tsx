import type { InputHTMLAttributes } from "react";
export function Input({ label, error, hint, className="", ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold text-slate-800">{label}</span><input {...props} className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${error ? "border-rose-300" : "border-slate-200"} ${className}`} />{hint && !error && <span className="text-xs text-slate-500">{hint}</span>}{error && <span className="text-xs font-medium text-rose-600">{error}</span>}</label>;
}
