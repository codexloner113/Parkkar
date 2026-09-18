"use client";
import { useMemo, useState } from "react";
import { CarFront, Bike, CircleHelp, Sparkles, Wrench, Check } from "lucide-react";
import type { ParkingService } from "@/types/service";
import type { VehicleType } from "@/types/vehicle";
import { money } from "@/lib/format";

const iconFor = (name:string) => name.toLowerCase().includes("puncture") || name.toLowerCase().includes("tyre") ? Wrench : name.toLowerCase().includes("bike") ? Bike : CarFront;

// Explicit per-service vehicle applicability, keyed by the exact seed service
// name (case-insensitive). A name-substring heuristic ("car"/"bike"/"ev" in
// the service name) was tried before this and got it backwards on real data:
// it offered "Interior Cleaning" — vacuum, dashboard wipe, mats, seat-area —
// to bikes, and hid "Car Cleaning"/"Complete Car Clean" from EVs even though
// an EV is a car. This table is explicit so both cases are correct, and any
// *new* service an admin adds later (a name not listed here) still shows for
// every vehicle type by default rather than silently disappearing.
const VEHICLE_SERVICE_MAP: Record<string, VehicleType[]> = {
  "car cleaning": ["CAR","EV","OTHER"],
  "ev charging": ["EV","OTHER"],
  "valet parking": ["CAR","EV","OTHER"],
  "interior cleaning": ["CAR","EV","OTHER"],
  "complete car clean": ["CAR","EV","OTHER"],
  "bike wash": ["BIKE","OTHER"],
  "tubeless puncture assistance": ["CAR","BIKE","EV","OTHER"],
  "tyre air top-up": ["CAR","BIKE","EV","OTHER"],
  "polish finish": ["CAR","BIKE","EV","OTHER"],
};
export const isVisibleForVehicle = (serviceName: string, vehicleType: VehicleType) => {
  const allowed = VEHICLE_SERVICE_MAP[serviceName.trim().toLowerCase()];
  return allowed ? allowed.includes(vehicleType) : true;
};

export function CareServicePicker({ services, vehicleType="CAR", selected, onChange }: { services: ParkingService[]; vehicleType?: VehicleType; selected: Record<string,number>; onChange:(next:Record<string,number>)=>void }) {
  const [cleaningOpen,setCleaningOpen]=useState(false);
  const visible = useMemo(() => services.filter(s => isVisibleForVehicle(s.name, vehicleType)), [services,vehicleType]);
  const update=(id:string, qty:number)=>onChange({...selected,[id]:Math.max(0,qty)});
  const cleaning = visible.filter(s => /wash|clean/i.test(s.name));
  const other = visible.filter(s => !/wash|clean/i.test(s.name));
  return <div className="space-y-4">
    <button type="button" onClick={()=>setCleaningOpen(v=>!v)} className={`w-full rounded-3xl border p-4 text-left transition ${cleaningOpen ? "border-cyan-400 bg-cyan-50" : "border-slate-200 bg-white hover:border-cyan-200"}`}>
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700"><Sparkles className="h-5 w-5"/></span><div className="flex-1"><div className="font-bold">Vehicle cleaning</div><p className="mt-1 text-xs text-slate-500">Outdoor, indoor and complete options. Car is selected by default; switch vehicle type above.</p></div><span className="text-sm font-bold text-cyan-700">{cleaningOpen ? "Open" : "Add"}</span></div>
    </button>
    {cleaningOpen && <div className="grid gap-3 sm:grid-cols-2">
      {cleaning.map(service => { const Icon=iconFor(service.name); const qty=selected[service.id]||0; return <button key={service.id} type="button" onClick={()=>update(service.id,qty?0:1)} className={`rounded-2xl border p-4 text-left ${qty?"border-cyan-400 bg-cyan-50":"border-slate-200 bg-white"}`}><div className="flex items-start gap-3"><span className="rounded-xl bg-slate-100 p-2"><Icon className="h-4 w-4"/></span><div className="flex-1"><div className="font-semibold">{service.name}</div><p className="mt-1 text-xs leading-5 text-slate-500">{service.description}</p><div className="mt-3 font-bold">{money(service.price)}</div></div>{qty>0&&<Check className="h-5 w-5 text-cyan-600"/>}</div></button> })}
    </div>}
    <div className="grid gap-3 sm:grid-cols-2">
      {other.map(service => { const Icon=iconFor(service.name); const qty=selected[service.id]||0; return <button key={service.id} type="button" onClick={()=>update(service.id,qty?0:1)} className={`rounded-2xl border p-4 text-left ${qty?"border-cyan-400 bg-cyan-50":"border-slate-200 bg-white"}`}><div className="flex items-start gap-3"><span className="rounded-xl bg-slate-100 p-2"><Icon className="h-4 w-4"/></span><div className="flex-1"><div className="font-semibold">{service.name}</div><p className="mt-1 text-xs leading-5 text-slate-500">{service.description}</p><div className="mt-3 font-bold">{money(service.price)}</div></div>{qty>0&&<Check className="h-5 w-5 text-cyan-600"/>}</div></button> })}
    </div>
    <p className="text-xs text-slate-500"><CircleHelp className="mr-1 inline h-3.5 w-3.5"/>Puncture assistance is for eligible tubeless tyres; parts or non-repairable tyre replacement are quoted separately before work.</p>
  </div>;
}
