"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ParkingSquare, Trash2 } from "lucide-react";
import { useState } from "react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

import {
  listSlots,
  createSlot,
  deleteSlot,
  type SlotPayload,
} from "@/lib/partner";

import { queryKeys } from "@/lib/queryKeys";
import { getApiError } from "@/lib/errors";

export default function SlotsPage() {
  return (
    <ProtectedRoute roles={["PARTNER"]}>
      <Slots />
    </ProtectedRoute>
  );
}

function Slots() {
  const { id } = useParams<{ id: string }>();
  const locationId = String(id);

  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.partner.slots(locationId),
    queryFn: () => listSlots(locationId),
  });

  const add = useMutation({
    mutationFn: (payload: SlotPayload) =>
      createSlot(locationId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.partner.slots(locationId),
      }),
  });

  const remove = useMutation({
    mutationFn: deleteSlot,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.partner.slots(locationId),
      }),
  });

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<SlotPayload>({
    slotCode: "",
    slotType: "CAR",
    priceHour: 30,
    status: "ACTIVE",
  });

  const [error, setError] = useState("");

  const resetForm = () => {
    setForm({
      slotCode: "",
      slotType: "CAR",
      priceHour: 30,
      status: "ACTIVE",
    });

    setError("");
  };

  const handleCreate = async () => {
    setError("");

    if (!form.slotCode.trim()) {
      setError("Enter a slot code.");
      return;
    }

    if (form.priceHour < 0) {
      setError("Price per hour cannot be negative.");
      return;
    }

    try {
      await add.mutateAsync({
        ...form,
        slotCode: form.slotCode.trim(),
      });

      resetForm();
      setOpen(false);
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  const handleDelete = async (slotId: string) => {
    setError("");

    try {
      await remove.mutateAsync(slotId);
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  return (
    <DashboardShell
      type="partner"
      title="Parking slots"
      subtitle="Keep every space accurately represented."
    >
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setError("");
            setOpen((current) => !current);
          }}
        >
          <Plus className="h-4 w-4" />
          Add slot
        </Button>
      </div>

      {open && (
        <Card className="mt-5 p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Input
              label="Slot code"
              value={form.slotCode}
              onChange={(event) =>
                setForm({
                  ...form,
                  slotCode: event.target.value,
                })
              }
              placeholder="M1"
            />

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Type
              </span>

              <select
                value={form.slotType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    slotType:
                      event.target.value as SlotPayload["slotType"],
                  })
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3"
              >
                <option value="CAR">CAR</option>
                <option value="BIKE">BIKE</option>
                <option value="EV">EV</option>
                <option value="ACCESSIBLE">
                  ACCESSIBLE
                </option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>

            <Input
              label="Price / hour"
              type="number"
              min="0"
              value={form.priceHour}
              onChange={(event) =>
                setForm({
                  ...form,
                  priceHour: Number(event.target.value),
                })
              }
            />

            <Button
              className="mt-7"
              loading={add.isPending}
              onClick={handleCreate}
            >
              Create
            </Button>
          </div>

          {error && (
            <div className="mt-3 text-sm text-rose-600">
              {error}
            </div>
          )}
        </Card>
      )}

      {error && !open && (
        <div className="mt-5 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <Card
              key={index}
              className="h-28 animate-pulse bg-slate-100"
            >
              <div className="h-full" />
            </Card>
          ))}

        {!isLoading &&
          data?.data.map((slot) => (
            <Card
              key={slot.id}
              className="p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <ParkingSquare className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="font-bold">
                      {slot.slot_code}
                    </div>

                    <div className="text-xs text-slate-500">
                      {slot.slot_type} · ₹
                      {slot.price_per_hour}/h
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(slot.id)}
                  disabled={remove.isPending}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Delete ${slot.slot_code}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <Badge
                  tone={
                    slot.status === "ACTIVE"
                      ? "success"
                      : slot.status === "MAINTENANCE"
                        ? "warning"
                        : "danger"
                  }
                >
                  {slot.status}
                </Badge>
              </div>
            </Card>
          ))}
      </div>
    </DashboardShell>
  );
}