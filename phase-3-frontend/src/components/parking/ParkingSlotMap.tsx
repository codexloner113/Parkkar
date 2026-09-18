"use client";

import { useState } from "react";
import { Bike, CarFront, Check, CircleAlert, Sparkles, Wrench, Zap } from "lucide-react";
import type { ParkingSlot, AvailableSlot, SlotType } from "@/types/parking";

export type SlotMeta = {
  level: string;
  nearLift?: boolean;
  nearExit?: boolean;
  cleaningBay?: boolean;
  distanceScore?: number;
};

function scoreSlot(slot: ParkingSlot, meta?: SlotMeta, cleaning = false) {
  let score = 0;
  if (meta?.nearExit) score += 3;
  if (meta?.nearLift) score += 2;
  if (cleaning && meta?.cleaningBay) score += 4;
  if (slot.slot_type === "ACCESSIBLE") score -= 1;
  return score;
}

function SlotIcon({ type }: { type: SlotType }) {
  if (type === "BIKE") return <Bike className="mx-auto h-4 w-4" />;
  if (type === "EV") return <Zap className="mx-auto h-4 w-4" />;
  if (type === "ACCESSIBLE") return <CarFront className="mx-auto h-4 w-4" />;
  return <CarFront className="mx-auto h-4 w-4" />;
}

export function ParkingSlotMap({
  slots,
  available,
  selectedId,
  onSelect,
  cleaningSelected = false,
  metadata = {},
  slotType,
}: {
  slots: ParkingSlot[];
  available?: AvailableSlot[];
  selectedId: string;
  onSelect: (id: string) => void;
  cleaningSelected?: boolean;
  metadata?: Record<string, SlotMeta>;
  slotType?: SlotType;
}) {
  const filteredSlots = slotType
    ? slots.filter((slot) => slot.slot_type === slotType)
    : slots;

  const availableIds = available
    ? new Set(available.map((item) => String(item.id)))
    : null;

  const bestIds = new Set(
    filteredSlots
      .filter(
        (slot) =>
          slot.status === "ACTIVE" &&
          (!availableIds || availableIds.has(String(slot.id))),
      )
      .sort(
        (a, b) =>
          scoreSlot(a, metadata[a.id], cleaningSelected) -
          scoreSlot(b, metadata[b.id], cleaningSelected),
      )
      .slice(-Math.min(3, filteredSlots.length))
      .map((slot) => slot.id),
  );

  const levels = Array.from(
    new Set(
      filteredSlots.map(
        (slot) =>
          metadata[slot.id]?.level ||
          slot.slot_code.split("-")[0] ||
          "P1",
      ),
    ),
  );

  const [activeLevel, setActiveLevel] = useState(levels[0] || "P1");

  const currentLevel = levels.includes(activeLevel)
    ? activeLevel
    : levels[0] || "P1";

  const levelSlots = filteredSlots.filter(
    (slot) =>
      (metadata[slot.id]?.level ||
        slot.slot_code.split("-")[0] ||
        "P1") === currentLevel,
  );

  return (
    <div className="space-y-5">
      {levels.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-2">
          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Parking levels">
            {levels.map((level) => {
              const selected = level === currentLevel;
              const count = filteredSlots.filter(
                (slot) =>
                  (metadata[slot.id]?.level ||
                    slot.slot_code.split("-")[0] ||
                    "P1") === level,
              ).length;

              return (
                <button
                  key={level}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveLevel(level);
                    const selectedSlot = filteredSlots.find(
                      (slot) => String(slot.id) === String(selectedId),
                    );
                    const selectedSlotLevel = selectedSlot
                      ? metadata[selectedSlot.id]?.level ||
                        selectedSlot.slot_code.split("-")[0] ||
                        "P1"
                      : null;
                    if (selectedSlotLevel && selectedSlotLevel !== level) {
                      onSelect("");
                    }
                  }}
                  className={`min-w-28 shrink-0 rounded-xl px-4 py-3 text-left transition ${
                    selected
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="block text-xs font-bold uppercase tracking-[0.14em] opacity-70">
                    Level
                  </span>
                  <span className="mt-0.5 block text-lg font-bold">{level}</span>
                  <span className="text-[11px] opacity-70">{count} slots</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 rounded-full border border-emerald-500 bg-white" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-slate-300" />
          Occupied / unavailable
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 rounded-full border-2 border-orange-400 bg-white" />
          Time conflict
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-cyan-400" />
          Best for you
        </span>
        {cleaningSelected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            <Sparkles className="h-3 w-3" /> Cleaning selected
          </span>
        )}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">
              Level {currentLevel}
            </div>
            <h3 className="mt-1 font-bold text-slate-950">Parking floor</h3>
          </div>
          <div className="text-xs text-slate-500">{levelSlots.length} slots</div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {levelSlots.map((slot) => {
            const isAvailable =
              slot.status === "ACTIVE" &&
              (!availableIds || availableIds.has(String(slot.id)));
            const isSelected = selectedId === String(slot.id);
            const isBest = bestIds.has(slot.id) && isAvailable;
            const meta = metadata[slot.id];

            return (
              <button
                key={slot.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => onSelect(String(slot.id))}
                title={
                  isBest
                    ? "Recommended: easier exit/lift/cleaning access"
                    : undefined
                }
                className={`relative aspect-square rounded-xl border text-xs font-bold transition ${
                  isSelected
                    ? "border-slate-950 bg-slate-950 text-white ring-2 ring-cyan-300"
                    : isBest
                      ? "border-cyan-400 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                      : isAvailable
                        ? "border-emerald-400 bg-white text-slate-700 hover:-translate-y-0.5"
                        : slot.status === "ACTIVE"
                          ? "cursor-not-allowed border-orange-300 bg-orange-50 text-orange-500"
                          : "cursor-not-allowed border-transparent bg-slate-200 text-slate-400"
                }`}
              >
                {slot.status === "MAINTENANCE" ? (
                  <Wrench className="mx-auto h-4 w-4" />
                ) : !isAvailable ? (
                  <CircleAlert className="mx-auto h-4 w-4" />
                ) : isSelected ? (
                  <Check className="mx-auto h-4 w-4" />
                ) : (
                  <SlotIcon type={slot.slot_type} />
                )}
                <span className="mt-1 block truncate">{slot.slot_code}</span>
                {isBest && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-cyan-400 px-1.5 py-0.5 text-[8px] text-slate-950">
                    BEST
                  </span>
                )}
                {cleaningSelected && meta?.cleaningBay && isAvailable && (
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-1 py-0.5 text-[8px] text-white">
                    CARE
                  </span>
                )}
                {meta?.nearLift && <span className="sr-only">Near lift</span>}
                {meta?.nearExit && <span className="sr-only">Near exit</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

