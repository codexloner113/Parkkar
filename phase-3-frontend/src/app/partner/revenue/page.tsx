"use client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getPartnerRevenue } from "@/lib/partner";
import { queryKeys } from "@/lib/queryKeys";
import { StatCard } from "@/components/dashboard/StatCard";
import { money } from "@/lib/format";
export default function PartnerRevenue(){return <ProtectedRoute roles={["PARTNER"]}><DashboardShell type="partner" title="Revenue" subtitle="Transparent gross, net, and platform commission figures."><Revenue/></DashboardShell></ProtectedRoute>}
function Revenue(){const {data,isLoading}=useQuery({queryKey:queryKeys.partner.revenue({}),queryFn:()=>getPartnerRevenue({})});if(isLoading)return <div>Loading…</div>;const r=data?.data;return <div className="grid gap-4 md:grid-cols-3"><StatCard label="Gross revenue" value={money(r?.gross_revenue)} icon={<BarChart3 className="h-5 w-5"/>}/><StatCard label="Partner net" value={money(r?.partner_net_revenue)} icon={<BarChart3 className="h-5 w-5"/>} accent="emerald"/><StatCard label="Platform commission" value={money(r?.platform_commission)} icon={<BarChart3 className="h-5 w-5"/>} accent="violet"/></div>}
