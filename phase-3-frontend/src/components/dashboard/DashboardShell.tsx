import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardNav } from "./DashboardNav";
export function DashboardShell({ type, title, subtitle, children }: { type:"partner"|"admin"; title:string; subtitle:string; children:ReactNode }){return <div className="min-h-screen bg-[#f7f8fa]"><Navbar/><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="mb-8"><div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">PARKKAR {type.toUpperCase()}</div><h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-slate-500">{subtitle}</p></div><div className="grid gap-6 lg:grid-cols-[220px_1fr]"><DashboardNav type={type}/><section>{children}</section></div></main></div>}
