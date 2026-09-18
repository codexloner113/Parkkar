"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PauseCircle, PlayCircle } from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { adminParking, adminUpdateParkingStatus } from "@/lib/admin";
import { queryKeys } from "@/lib/queryKeys";
import { money } from "@/lib/format";
import { getApiError } from "@/lib/errors";

export default function AdminParking() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <DashboardShell
        type="admin"
        title="Parking locations"
        subtitle="Review and control parking listing lifecycle from the platform."
      >
        <Parking />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function Parking() {
  const queryClient = useQueryClient();
  const [errorText, setErrorText] = useState("");

  const query = useQuery({
    queryKey: queryKeys.admin.parking({ page: 1, limit: 100 }),
    queryFn: () => adminParking({ page: 1, limit: 100 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "PENDING_APPROVAL" | "ACTIVE" | "INACTIVE";
    }) => adminUpdateParkingStatus(id, status),
    onSuccess: () => {
      setErrorText("");
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.parking({ page: 1, limit: 100 }),
      });
    },
    onError: (error) => {
      setErrorText(
        getApiError(error, "Unable to update parking status.").message,
      );
    },
  });

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">
        Admin approval controls are connected to the backend lifecycle endpoint.
      </div>

      {errorText && (
        <div className="px-5 pt-5">
          <Alert message={errorText} />
        </div>
      )}

      {query.isLoading ? (
        <div className="p-6">Loading parking…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">City</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.data.map((parking) => (
                <tr key={parking.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold">
                    {parking.name}
                    <div className="text-xs font-normal text-slate-400">
                      {parking.property_type.replaceAll("_", " ")}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    {parking.city}
                  </td>

                  <td className="px-5 py-4">
                    {money(parking.min_price_per_hour)}
                  </td>

                  <td className="px-5 py-4">
                    <Badge
                      tone={
                        parking.status === "ACTIVE" ? "success" : "warning"
                      }
                    >
                      {parking.status}
                    </Badge>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {parking.status !== "ACTIVE" && (
                        <Button
                          className="px-3 py-2"
                          onClick={() =>
                            statusMutation.mutate({
                              id: parking.id,
                              status: "ACTIVE",
                            })
                          }
                          loading={statusMutation.isPending}
                        >
                          <PlayCircle className="h-4 w-4" />
                          Activate
                        </Button>
                      )}

                      {parking.status !== "INACTIVE" && (
                        <Button
                          variant="secondary"
                          className="px-3 py-2"
                          onClick={() =>
                            statusMutation.mutate({
                              id: parking.id,
                              status: "INACTIVE",
                            })
                          }
                          loading={statusMutation.isPending}
                        >
                          <PauseCircle className="h-4 w-4" />
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
