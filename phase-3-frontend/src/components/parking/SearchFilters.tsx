"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ParkingSearchParams } from "@/lib/parking";
import type { SlotType } from "@/types/parking";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type SearchFiltersProps = {
  value: ParkingSearchParams;
  onChange: (value: ParkingSearchParams) => void;
  onReset: () => void;
};

export function SearchFilters({
  value,
  onChange,
  onReset,
}: SearchFiltersProps) {
  const updateValue = <K extends keyof ParkingSearchParams>(
    key: K,
    nextValue: ParkingSearchParams[K],
  ) => {
    onChange({
      ...value,
      [key]: nextValue,
    });
  };

  const handleSlotTypeChange = (nextValue: string) => {
    const slotType = nextValue
      ? (nextValue as SlotType)
      : undefined;

    updateValue("slotType", slotType);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-end">
        <Input
          label="City"
          value={value.city ?? ""}
          onChange={(event) =>
            updateValue("city", event.target.value || undefined)
          }
          placeholder="Kanpur"
        />

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">
            Property
          </span>

          <select
            value={value.propertyType ?? ""}
            onChange={(event) =>
              updateValue(
                "propertyType",
                event.target.value || undefined,
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-400"
          >
            <option value="">Any type</option>
            <option value="HOTEL">Hotel</option>
            <option value="MALL">Mall</option>
            <option value="COMMERCIAL_BUILDING">
              Commercial building
            </option>
            <option value="BANQUET_HALL">Banquet hall</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">
            Slot
          </span>

          <select
            value={value.slotType ?? ""}
            onChange={(event) =>
              handleSlotTypeChange(event.target.value)
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-400"
          >
            <option value="">Any slot</option>
            <option value="CAR">Car</option>
            <option value="BIKE">Bike</option>
            <option value="EV">EV</option>
            <option value="ACCESSIBLE">Accessible</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Min ₹"
            type="number"
            min="0"
            value={value.minPrice ?? ""}
            onChange={(event) =>
              updateValue(
                "minPrice",
                event.target.value
                  ? Number(event.target.value)
                  : undefined,
              )
            }
            placeholder="0"
          />

          <Input
            label="Max ₹"
            type="number"
            min="0"
            value={value.maxPrice ?? ""}
            onChange={(event) =>
              updateValue(
                "maxPrice",
                event.target.value
                  ? Number(event.target.value)
                  : undefined,
              )
            }
            placeholder="500"
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" className="flex-1">
            <Search className="h-4 w-4" />
            Search
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            aria-label="Reset filters"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters update real backend search results.
      </div>
    </div>
  );
}