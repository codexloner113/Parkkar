import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
// LanguageProvider is mounted once at the app root (src/app/providers.tsx) so
// it covers every shell — AppShell, DashboardShell, and bare pages alike.
// It must NOT be re-declared here: a second instance would give this shell's
// subtree its own isolated language state, out of sync with the rest of the app.
export function AppShell({ children, footer=true }: { children: ReactNode; footer?: boolean }) { return <div className="min-h-screen bg-[#f7f8fa] text-slate-950"><Navbar/>{children}{footer&&<Footer/>}</div>; }
