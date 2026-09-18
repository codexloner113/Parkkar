"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminBookings } from "@/lib/admin";
import { queryKeys } from "@/lib/queryKeys";
import { money,statusTone } from "@/lib/format";
export default function AdminBookings(){return <ProtectedRoute roles={["ADMIN"]}><DashboardShell type="admin" title="Bookings" subtitle="Platform-wide reservation operations."><Bookings/></DashboardShell></ProtectedRoute>}
function Bookings(){const {data,isLoading}=useQuery({queryKey:queryKeys.admin.bookings({page:1,limit:100}),queryFn:()=>adminBookings({page:1,limit:100})});return <Card className="overflow-hidden">{isLoading?<div className="p-6">Loading bookings…</div>:<div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-5 py-4">Booking</th><th className="px-5 py-4">Time</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4">Total</th></tr></thead><tbody>{data?.data.map(b=><tr key={b.id} className="border-t border-slate-100"><td className="px-5 py-4"><Link className="font-semibold hover:text-cyan-600" href={`/bookings/${b.id}`}>#{b.id} · {b.location_name}</Link><div className="text-xs text-slate-400">{b.location_city} · {b.slot_code} · {b.plate_number||"No vehicle"}</div></td><td className="px-5 py-4 text-slate-500">{new Date(b.start_time).toLocaleString("en-IN")}</td><td className="px-5 py-4"><Badge tone={statusTone(b.status)}>{b.status}</Badge></td><td className="px-5 py-4">{b.latest_payment_status||"—"}</td><td className="px-5 py-4 font-bold">{money(b.total_amount)}</td></tr>)}</tbody></table></div>}</Card>}
