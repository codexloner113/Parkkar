"use client";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminPayments } from "@/lib/admin";
import { queryKeys } from "@/lib/queryKeys";
import { money,statusTone } from "@/lib/format";
export default function AdminPayments(){return <ProtectedRoute roles={["ADMIN"]}><DashboardShell type="admin" title="Payments" subtitle="Recorded transactions from the backend."><Payments/></DashboardShell></ProtectedRoute>}
function Payments(){const {data,isLoading}=useQuery({queryKey:queryKeys.admin.payments({page:1,limit:100}),queryFn:()=>adminPayments({page:1,limit:100})});return <Card className="overflow-hidden">{isLoading?<div className="p-6">Loading payments…</div>:<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-5 py-4">Transaction</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Method</th></tr></thead><tbody>{data?.data.map(p=><tr key={p.id} className="border-t border-slate-100"><td className="px-5 py-4"><div className="font-semibold">{p.transaction_ref||`Payment #${p.id}`}</div><div className="text-xs text-slate-400">Booking #{p.booking_id}</div></td><td className="px-5 py-4">{p.location_name}</td><td className="px-5 py-4 font-bold">{money(p.amount)}</td><td className="px-5 py-4"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td><td className="px-5 py-4 text-slate-500">{p.method||"—"}</td></tr>)}</tbody></table></div>}</Card>}
