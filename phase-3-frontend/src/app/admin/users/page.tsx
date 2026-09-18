"use client";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminUsers } from "@/lib/admin";
import { queryKeys } from "@/lib/queryKeys";
export default function AdminUsers(){return <ProtectedRoute roles={["ADMIN"]}><DashboardShell type="admin" title="Users" subtitle="Account registry from the backend."><UsersTable/></DashboardShell></ProtectedRoute>}
function UsersTable(){const {data,isLoading}=useQuery({queryKey:queryKeys.admin.users({page:1,limit:100}),queryFn:()=>adminUsers({page:1,limit:100})});return <Card className="overflow-hidden">{isLoading?<div className="p-6">Loading users…</div>:<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-5 py-4">User</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Phone</th></tr></thead><tbody>{data?.data.map(u=><tr key={u.id} className="border-t border-slate-100"><td className="px-5 py-4"><div className="font-semibold">{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></td><td className="px-5 py-4"><Badge tone={u.role==="ADMIN"?"danger":u.role==="PARTNER"?"info":"neutral"}>{u.role}</Badge></td><td className="px-5 py-4"><Badge tone={u.account_status==="ACTIVE"?"success":"warning"}>{u.account_status}</Badge></td><td className="px-5 py-4 text-slate-500">{u.phone}</td></tr>)}</tbody></table></div>}</Card>}
