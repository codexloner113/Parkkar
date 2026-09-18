"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { listPartnerBookings } from "@/lib/partner";
import { queryKeys } from "@/lib/queryKeys";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { dateTime, money, statusTone } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
export default function PartnerBookings(){return <ProtectedRoute roles={["PARTNER"]}><DashboardShell type="partner" title="Bookings" subtitle="Reservations across your locations."><Bookings/></DashboardShell></ProtectedRoute>}
function Bookings(){const {data,isLoading}=useQuery({queryKey:queryKeys.partner.bookings({page:1,limit:100}),queryFn:()=>listPartnerBookings({page:1,limit:100})});if(isLoading)return <Card className="p-6">Loading bookings…</Card>;if(!data?.data.length)return <EmptyState icon={<Receipt/>} title="No bookings yet"/>;return <div className="space-y-3">{data.data.map(b=><Link key={b.id} href={`/bookings/${b.id}`} className="block"><Card className="p-5 hover:shadow-md"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-bold">{b.location_name}<Badge tone={statusTone(b.status)}>{b.status}</Badge></div><div className="mt-1 text-sm text-slate-500">{b.slot_code} · {b.plate_number||"No vehicle"} · {dateTime(b.start_time)}</div></div><div className="font-bold">{money(b.total_amount)}</div></div></Card></Link>)}</div>}
