"use client";

import { useState } from "react";
import {
  CarFront,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from "@/hooks/useResources";

import { getApiError } from "@/lib/errors";
import type { VehicleType } from "@/types/vehicle";

export default function VehiclesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">
              GARAGE
            </div>

            <h1 className="mt-2 text-4xl font-bold">
              Your vehicles
            </h1>

            <p className="mt-2 text-slate-500">
              Keep plates ready so booking takes seconds, not minutes.
            </p>
          </div>

          <VehicleManager />
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}

function VehicleManager() {
  const { data, isLoading } = useVehicles();

  const create = useCreateVehicle();
  const update = useUpdateVehicle();
  const remove = useDeleteVehicle();

  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState<{
    vehicleType: VehicleType;
    plateNumber: string;
    make: string;
    model: string;
  }>({
    vehicleType: "CAR",
    plateNumber: "",
    make: "",
    model: "",
  });

  const reset = () => {
    setForm({
      vehicleType: "CAR",
      plateNumber: "",
      make: "",
      model: "",
    });

    setEditing(null);
    setOpen(false);
    setError("");
  };

  const submit = async () => {
    setError("");

    const plateNumber = form.plateNumber.trim();

    if (plateNumber.length < 2) {
      setError("Enter a valid plate number.");
      return;
    }

    try {
      if (editing) {
        await update.mutateAsync({
          id: editing,
          payload: {
            vehicleType: form.vehicleType,
            plateNumber,
            make: form.make.trim() || undefined,
            model: form.model.trim() || undefined,
          },
        });
      } else {
        await create.mutateAsync({
          vehicleType: form.vehicleType,
          plateNumber,
          make: form.make.trim() || undefined,
          model: form.model.trim() || undefined,
        });
      }

      reset();
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    setError("");

    try {
      await remove.mutateAsync(deleteId);
      setDeleteId(null);
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add vehicle
        </Button>
      </div>

      {error && (
        <div className="mt-5">
          <Alert message={error} />
        </div>
      )}

      {open && (
        <Card className="mt-5 p-6">
          <h2 className="text-xl font-bold">
            {editing ? "Edit vehicle" : "Add vehicle"}
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">
                Type
              </span>

              <select
                value={form.vehicleType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    vehicleType:
                      event.target.value as VehicleType,
                  })
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3"
              >
                <option value="CAR">CAR</option>
                <option value="BIKE">BIKE</option>
                <option value="EV">EV</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>

            <Input
              label="Plate number"
              value={form.plateNumber}
              onChange={(event) =>
                setForm({
                  ...form,
                  plateNumber:
                    event.target.value.toUpperCase(),
                })
              }
              placeholder="UP32AB1234"
            />

            <Input
              label="Make"
              value={form.make}
              onChange={(event) =>
                setForm({
                  ...form,
                  make: event.target.value,
                })
              }
              placeholder="Tata"
            />

            <Input
              label="Model"
              value={form.model}
              onChange={(event) =>
                setForm({
                  ...form,
                  model: event.target.value,
                })
              }
              placeholder="Nexon"
            />
          </div>

          <div className="mt-5 flex gap-3">
            <Button
              onClick={submit}
              loading={
                create.isPending || update.isPending
              }
            >
              {editing ? "Save changes" : "Add vehicle"}
            </Button>

            <Button
              variant="ghost"
              onClick={reset}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <Card
              key={index}
              className="h-24 animate-pulse bg-slate-100"
            >
              <div className="h-full" />
            </Card>
          ))}

        {!isLoading &&
          !data?.data.length && (
            <Card className="p-10 text-center text-sm text-slate-500">
              No vehicles yet. Add your first vehicle above.
            </Card>
          )}

        {!isLoading &&
          data?.data.map((vehicle) => (
            <Card
              key={vehicle.id}
              className="p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <CarFront className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="font-bold">
                      {vehicle.plate_number}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {vehicle.vehicle_type}{" "}
                      {vehicle.make
                        ? `· ${vehicle.make}`
                        : ""}{" "}
                      {vehicle.model
                        ? vehicle.model
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditing(vehicle.id);
                      setForm({
                        vehicleType:
                          vehicle.vehicle_type,
                        plateNumber:
                          vehicle.plate_number,
                        make:
                          vehicle.make || "",
                        model:
                          vehicle.model || "",
                      });
                      setError("");
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setError("");
                      setDeleteId(vehicle.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete this vehicle?"
        description="A vehicle with booking history cannot be deleted by the backend. If that happens, the booking history remains safe."
        confirmLabel="Delete vehicle"
        danger
        loading={remove.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}