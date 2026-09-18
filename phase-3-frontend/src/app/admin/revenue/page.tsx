"use client";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarChart3 } from "lucide-react";
import { adminRevenue } from "@/lib/admin";
import { queryKeys } from "@/lib/queryKeys";
import { money } from "@/lib/format";
export default function AdminRevenue(){return <ProtectedRoute roles={["ADMIN"]}><DashboardShell type="admin" title="Revenue" subtitle="Gross platform revenue and commission figures."><Revenue/></DashboardShell></ProtectedRoute>}
function Revenue(){const {data,isLoading}=useQuery({queryKey:queryKeys.admin.revenue({}),queryFn:()=>adminRevenue({})});if(isLoading)return <div>Loading…</div>;return <div className="grid gap-4 md:grid-cols-2"><StatCard label="Gross revenue" value={money(data?.data.gross_revenue)} icon={<BarChart3 className="h-5 w-5"/>}/><StatCard label="Platform commission" value={money(data?.data.platform_commission)} icon={<BarChart3 className="h-5 w-5"/>} accent="violet"/></div>}
