"use client";

import mapboxgl from "mapbox-gl";
import React, { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";

interface MapboxMapProps {
  initialLat?: number;
  initialLng?: number;
  zoom?: number;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number, placeName?: string) => void;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    category: string;
    severity: string;
    status: string;
  }>;
  className?: string;
}

export default function MapboxMap({
  initialLat = 40.7128,
  initialLng = -74.006,
  zoom = 12,
  interactive = true,
  onLocationSelect,
  markers = [],
  className = "h-[350px] w-full rounded-xl overflow-hidden shadow-inner border border-border/50",
}: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  );

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (token) {
      mapboxgl.accessToken = token;
    }

    // High quality OpenStreetMap fallback when Mapbox token is not set
    const mapStyle: mapboxgl.Style | string = token
      ? "mapbox://styles/mapbox/streets-v12"
      : ({
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm-tiles-layer",
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        } as any);

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [initialLng, initialLat],
        zoom: zoom,
        interactive: interactive,
      });

      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      if (interactive && onLocationSelect) {
        if (initialLat && initialLng) {
          const marker = new mapboxgl.Marker({
            color: "#2563eb",
            draggable: true,
          })
            .setLngLat([initialLng, initialLat])
            .addTo(map);

          selectedMarkerRef.current = marker;

          marker.on("dragend", () => {
            const lngLat = marker.getLngLat();
            setSelectedCoords({ lat: lngLat.lat, lng: lngLat.lng });
            onLocationSelect(lngLat.lat, lngLat.lng);
          });
        }

        map.on("click", (e) => {
          const { lat, lng } = e.lngLat;
          setSelectedCoords({ lat, lng });

          if (selectedMarkerRef.current) {
            selectedMarkerRef.current.setLngLat([lng, lat]);
          } else {
            const marker = new mapboxgl.Marker({
              color: "#2563eb",
              draggable: true,
            })
              .setLngLat([lng, lat])
              .addTo(map);

            selectedMarkerRef.current = marker;

            marker.on("dragend", () => {
              const newLngLat = marker.getLngLat();
              setSelectedCoords({ lat: newLngLat.lat, lng: newLngLat.lng });
              onLocationSelect(newLngLat.lat, newLngLat.lng);
            });
          }

          onLocationSelect(lat, lng);
        });
      }

      markers.forEach((m) => {
        if (!m.latitude || !m.longitude) return;

        const color =
          m.severity === "CRITICAL"
            ? "#ef4444"
            : m.severity === "HIGH"
              ? "#f59e0b"
              : m.severity === "MEDIUM"
                ? "#3b82f6"
                : "#10b981";

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 4px; font-family: system-ui;">
            <strong style="font-size: 14px;">${m.title}</strong>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${m.category} • ${m.status}</p>
          </div>
        `);

        new mapboxgl.Marker({ color })
          .setLngLat([m.longitude, m.latitude])
          .setPopup(popup)
          .addTo(map);
      });
    } catch (e) {
      console.warn("Mapbox initialization fallback error:", e);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [initialLat, initialLng, zoom, interactive, markers, token]);

  return (
    <div className="relative w-full">
      <div ref={mapContainerRef} className={className} />
      {interactive && selectedCoords && (
        <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur border border-border px-3 py-1.5 rounded-lg text-xs shadow-md font-mono text-muted-foreground flex items-center gap-1.5 z-10">
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>
            {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
}
