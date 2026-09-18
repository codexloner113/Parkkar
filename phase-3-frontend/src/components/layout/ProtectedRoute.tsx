"use client";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Array<"USER"|"PARTNER"|"ADMIN"> }) { const { user, isLoading }=useAuth(); const router=useRouter(); useEffect(()=>{ if(!isLoading && !user) router.replace("/login"); },[isLoading,user,router]); if(isLoading || !user) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-cyan-500"/></div>; if(roles && !roles.includes(user.role)) return <div className="mx-auto max-w-xl px-6 py-20 text-center"><h1 className="text-2xl font-bold">Access unavailable</h1><p className="mt-2 text-slate-500">You don’t have permission to view this area.</p></div>; return <>{children}</>; }
