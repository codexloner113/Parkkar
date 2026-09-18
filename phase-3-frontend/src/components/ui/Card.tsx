import type { ReactNode } from "react";
export function Card({ children, className="", dark=false }: { children: ReactNode; className?: string; dark?: boolean }) { return <div className={`rounded-3xl border shadow-sm ${dark ? "border-white/10 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-950"} ${className}`}>{children}</div>; }
