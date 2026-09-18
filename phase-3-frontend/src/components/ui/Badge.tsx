import type { ReactNode } from "react";

export function Badge({ children, tone="neutral" }: { children: ReactNode; tone?: "neutral"|"success"|"warning"|"danger"|"info" }) {
  const map = { neutral: "bg-slate-100 text-slate-700", success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700", danger: "bg-rose-50 text-rose-700", info: "bg-cyan-50 text-cyan-700" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${map[tone]}`}>{children}</span>;
}
