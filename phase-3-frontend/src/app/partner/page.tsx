"use client";
import { MapPinned, Receipt, WalletCards } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { listOwnLocations, listPartnerBookings, getPartnerRevenue } from "@/lib/partner";
import { queryKeys } from "@/lib/queryKeys";
import { Card } from "@/components/ui/Card";
import { money } from "@/lib/format";

export default function PartnerDashboard(){return <ProtectedRoute roles={["PARTNER"]}><Partner/></ProtectedRoute>}
function Partner(){const {user}=useAuth();const loc=useQuery({queryKey:queryKeys.partner.locations(),queryFn:listOwnLocations});const bookings=useQuery({queryKey:queryKeys.partner.bookings({page:1,limit:100}),queryFn:()=>listPartnerBookings({page:1,limit:100})});const revenue=useQuery({queryKey:queryKeys.partner.revenue({}),queryFn:()=>getPartnerRevenue({})});return <DashboardShell type="partner" title={`Good to see you, ${user?.name?.split(" ")[0]||"partner"}.`} subtitle="A focused control room for your parking business."><div className="grid gap-4 md:grid-cols-3"><StatCard label="Locations" value={String(loc.data?.data.length??0)} icon={<MapPinned className="h-5 w-5"/>}/><StatCard label="Bookings" value={String(bookings.data?.meta?.total??bookings.data?.data.length??0)} icon={<Receipt className="h-5 w-5"/>} accent="violet"/><StatCard label="Net revenue" value={money(revenue.data?.data.partner_net_revenue)} hint="All-time API range" icon={<WalletCards className="h-5 w-5"/>} accent="emerald"/></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Card className="p-6"><h2 className="text-lg font-bold">Your locations</h2><div className="mt-4 space-y-3">{loc.data?.data.slice(0,5).map(l=><div key={l.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><div className="font-semibold">{l.name}</div><div className="mt-1 text-xs text-slate-500">{l.city} · {l.status}</div></div><span className="text-xs font-bold text-slate-400">{l.property_type}</span></div>)}</div></Card><Card dark className="p-6"><h2 className="text-lg font-bold">Revenue split</h2><div className="mt-5 space-y-4 text-sm"><Row label="Gross revenue" value={money(revenue.data?.data.gross_revenue)}/><Row label="Your net" value={money(revenue.data?.data.partner_net_revenue)}/><Row label="Platform commission" value={money(revenue.data?.data.platform_commission)}/></div></Card></div></DashboardShell>}
function Row({label,value}:{label:string;value:string}){return <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-slate-400">{label}</span><span className="font-bold text-white">{value}</span></div>}
