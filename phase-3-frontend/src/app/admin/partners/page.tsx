"use client";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminPartners } from "@/lib/admin";
import { queryKeys } from "@/lib/queryKeys";
export default function AdminPartners(){return <ProtectedRoute roles={["ADMIN"]}><DashboardShell type="admin" title="Partners" subtitle="Partner accounts and commission rates."><Partners/></DashboardShell></ProtectedRoute>}
function Partners(){const {data,isLoading}=useQuery({queryKey:queryKeys.admin.partners({page:1,limit:100}),queryFn:()=>adminPartners({page:1,limit:100})});return <Card className="overflow-hidden">{isLoading?<div className="p-6">Loading partners…</div>:<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-5 py-4">Partner</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Commission</th></tr></thead><tbody>{data?.data.map(p=><tr key={p.id} className="border-t border-slate-100"><td className="px-5 py-4"><div className="font-semibold">{p.name}</div><div className="text-xs text-slate-400">{p.email}</div></td><td className="px-5 py-4"><Badge tone={p.account_status==="ACTIVE"?"success":"warning"}>{p.account_status}</Badge></td><td className="px-5 py-4 font-semibold">{p.commission_rate_percent?`${p.commission_rate_percent}%`:"—"}</td></tr>)}</tbody></table></div>}</Card>}
