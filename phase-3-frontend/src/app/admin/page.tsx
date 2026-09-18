"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CreditCard,
  MapPinned,
  Receipt,
  Users,
} from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  adminUsers,
  adminPartners,
  adminParking,
  adminBookings,
  adminPayments,
  adminRevenue,
} from "@/lib/admin";
import { queryKeys } from "@/lib/queryKeys";
import { money } from "@/lib/format";

export default function AdminDashboard() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <DashboardShell
        type="admin"
        title="Platform control room"
        subtitle="Monitor the Parkkar marketplace with real backend data."
      >
        <Overview />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function Overview() {
  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users({ page: 1, limit: 1 }),
    queryFn: () => adminUsers({ page: 1, limit: 1 }),
  });

  const partnersQuery = useQuery({
    queryKey: queryKeys.admin.partners({ page: 1, limit: 1 }),
    queryFn: () => adminPartners({ page: 1, limit: 1 }),
  });

  const parkingQuery = useQuery({
    queryKey: queryKeys.admin.parking({ page: 1, limit: 100 }),
    queryFn: () => adminParking({ page: 1, limit: 100 }),
  });

  const bookingsQuery = useQuery({
    queryKey: queryKeys.admin.bookings({ page: 1, limit: 1 }),
    queryFn: () => adminBookings({ page: 1, limit: 1 }),
  });

  const paymentsQuery = useQuery({
    queryKey: queryKeys.admin.payments({ page: 1, limit: 1 }),
    queryFn: () => adminPayments({ page: 1, limit: 1 }),
  });

  const revenueQuery = useQuery({
    queryKey: queryKeys.admin.revenue({}),
    queryFn: () => adminRevenue({}),
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={String(usersQuery.data?.meta?.total ?? "—")}
          icon={<Users className="h-5 w-5" />}
        />

        <StatCard
          label="Partners"
          value={String(partnersQuery.data?.meta?.total ?? "—")}
          icon={<Users className="h-5 w-5" />}
          accent="violet"
        />

        <StatCard
          label="Parking locations"
          value={String(parkingQuery.data?.meta?.total ?? "—")}
          icon={<MapPinned className="h-5 w-5" />}
          accent="emerald"
        />

        <StatCard
          label="Bookings"
          value={String(bookingsQuery.data?.meta?.total ?? "—")}
          icon={<Receipt className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 font-bold">
            <CreditCard className="h-5 w-5 text-cyan-600" />
            Payments recorded
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {paymentsQuery.data?.meta?.total ?? 0} payment rows in the
            database.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <div className="flex items-center gap-2 font-bold">
            <BarChart3 className="h-5 w-5 text-cyan-300" />
            Platform commission
          </div>

          <div className="mt-3 text-3xl font-bold">
            {money(revenueQuery.data?.data.platform_commission)}
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Based on paid payments in the backend&apos;s default range.
          </p>
        </div>
      </div>
    </>
  );
}