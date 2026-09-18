"use client";

import { useEffect, useRef } from "react";

export interface ParkingMapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  min_price_per_hour?: number | null;
}

type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: { lat: number; lng: number };
        zoom: number;
        mapId?: string;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
      },
    ) => GoogleMapInstance;
    Marker: new (options: {
      map: GoogleMapInstance;
      position: { lat: number; lng: number };
      title?: string;
    }) => GoogleMarkerInstance;
    LatLngBounds: new () => GoogleBoundsInstance;
  };
};

type GoogleMapInstance = {
  fitBounds: (bounds: GoogleBoundsInstance, padding?: number) => void;
  setCenter: (center: { lat: number; lng: number }) => void;
};

type GoogleMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
  addListener: (event: string, handler: () => void) => void;
};

type GoogleBoundsInstance = {
  extend: (position: { lat: number; lng: number }) => void;
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

interface GoogleParkingMapProps {
  center: { lat: number; lng: number };
  markers: ParkingMapMarker[];
  mapId?: string;
  height?: string;
  onMarkerClick?: (id: string) => void;
}

export function GoogleParkingMap({
  center,
  markers,
  mapId,
  height = "420px",
  onMarkerClick,
}: GoogleParkingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRefs = useRef<GoogleMarkerInstance[]>([]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !containerRef.current) {
      return;
    }

    const initializeMap = () => {
      if (!containerRef.current || !window.google?.maps) {
        return;
      }

      const google = window.google;

      mapRef.current = new google.maps.Map(containerRef.current, {
        center,
        zoom: 13,
        mapId: mapId || process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    };

    if (window.google?.maps) {
      initializeMap();
    } else {
      window.addEventListener(
        "parkkar-google-maps-ready",
        initializeMap,
        { once: true },
      );
    }

    return () => {
      window.removeEventListener(
        "parkkar-google-maps-ready",
        initializeMap,
      );
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current = [];
      mapRef.current = null;
    };
  }, [apiKey, center.lat, center.lng, mapId]);

  useEffect(() => {
    const map = mapRef.current;
    const google = window.google;

    if (!map || !google?.maps) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];

    if (markers.length === 0) {
      map.setCenter(center);
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    for (const parking of markers) {
      const position = {
        lat: Number(parking.latitude),
        lng: Number(parking.longitude),
      };

      const marker = new google.maps.Marker({
        map,
        position,
        title: parking.name,
      });

      marker.addListener("click", () => {
        onMarkerClick?.(parking.id);
      });

      markerRefs.current.push(marker);
      bounds.extend(position);
    }

    if (markers.length === 1) {
      map.setCenter({
        lat: Number(markers[0].latitude),
        lng: Number(markers[0].longitude),
      });
    } else {
      bounds.extend(center);
      map.fitBounds(bounds, 48);
    }
  }, [center, markers, onMarkerClick]);

  if (!apiKey) {
    return (
      <div
        className="flex items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-100 text-center"
        style={{ minHeight: height }}
      >
        <div className="px-6">
          <p className="text-sm font-semibold text-slate-700">
            Google Maps is ready but not activated yet.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY after Google Cloud billing and
            API-key setup is complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100"
      style={{ minHeight: height }}
      aria-label="Parkkar parking map"
    />
  );
}
