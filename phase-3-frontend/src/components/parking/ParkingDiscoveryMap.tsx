"use client";
import { CarFront, MapPin } from "lucide-react";
import type { ParkingSearchResult } from "@/types/parking";
import { GoogleParkingMap } from "@/components/parking/GoogleParkingMap";

export function ParkingDiscoveryMap({
  locations,
  center,
  onSelect,
}: { locations: ParkingSearchResult[]; center: {lat:number;lng:number}; onSelect?: (id:string)=>void }) {
  const markers = locations.filter((x) => Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude))).map((x) => ({
    id: x.id, name: x.name, latitude: Number(x.latitude), longitude: Number(x.longitude), min_price_per_hour: x.min_price_per_hour ? Number(x.min_price_per_hour) : null,
  }));
  const hasKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  if (hasKey) return <GoogleParkingMap center={center} markers={markers} height="100%" onMarkerClick={onSelect} />;
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-slate-200 bg-[#eef5f8]">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(34,211,238,.20),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(99,102,241,.12),transparent_32%)]" />
      {markers.slice(0,8).map((m, i) => (
        <button key={m.id} type="button" onClick={() => onSelect?.(m.id)} className="absolute z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-slate-950 text-cyan-300 shadow-sm transition hover:scale-110" style={{left:`${18 + (i*17)%68}%`,top:`${22 + (i*23)%58}%`}} aria-label={`Open ${m.name}`}>
          <CarFront className="h-5 w-5" />
        </button>
      ))}
      <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-white/70 bg-white/90 p-4 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-bold"><MapPin className="h-4 w-4 text-cyan-600" />Parkkar parking map</div>
        <p className="mt-1 text-xs text-slate-500">Add your Google Maps key to switch this preview to live Google Maps. Parking cards and slot maps work without it.</p>
      </div>
    </div>
  );
}
