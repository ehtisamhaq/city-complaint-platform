"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState, useCallback } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconFlame,
  IconFocusCentered,
  IconInfoCircle,
  IconLayersSubtract,
  IconMapPin,
  IconRoad,
  IconTool,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface MapMarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  category: string;
  severity: string;
  status: string;
  locationName?: string;
}

interface MapboxMapProps {
  initialLat?: number;
  initialLng?: number;
  zoom?: number;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number, placeName?: string) => void;
  onMarkerClick?: (complaintId: string) => void;
  markers?: MapMarkerItem[];
  className?: string;
  showLegend?: boolean;
  showRecenterButton?: boolean;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSeverityConfig(severity: string) {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return {
        bg: "#EF4444",
        border: "#991B1B",
        text: "#FFFFFF",
        badgeBg: "rgba(239, 68, 68, 0.15)",
        badgeBorder: "rgba(239, 68, 68, 0.4)",
        label: "CRITICAL",
        isPulse: true,
      };
    case "HIGH":
      return {
        bg: "#F59E0B",
        border: "#B45309",
        text: "#FFFFFF",
        badgeBg: "rgba(245, 158, 11, 0.15)",
        badgeBorder: "rgba(245, 158, 11, 0.4)",
        label: "HIGH",
        isPulse: false,
      };
    case "MEDIUM":
      return {
        bg: "#3B82F6",
        border: "#1D4ED8",
        text: "#FFFFFF",
        badgeBg: "rgba(59, 130, 246, 0.15)",
        badgeBorder: "rgba(59, 130, 246, 0.4)",
        label: "MEDIUM",
        isPulse: false,
      };
    default:
      return {
        bg: "#10B981",
        border: "#047857",
        text: "#FFFFFF",
        badgeBg: "rgba(16, 185, 129, 0.15)",
        badgeBorder: "rgba(16, 185, 129, 0.4)",
        label: "LOW",
        isPulse: false,
      };
  }
}

function getStatusBadgeStyle(status: string) {
  switch (status?.toUpperCase()) {
    case "RESOLVED":
    case "CLOSED":
      return { bg: "#064E3B", text: "#34D399", label: "Resolved" };
    case "IN_PROGRESS":
      return { bg: "#1E3A8A", text: "#60A5FA", label: "In Progress" };
    case "ASSIGNED":
      return { bg: "#78350F", text: "#FBBF24", label: "Assigned" };
    case "REJECTED":
      return { bg: "#7F1D1D", text: "#F87171", label: "Rejected" };
    default:
      return { bg: "#374151", text: "#9CA3AF", label: "Pending" };
  }
}

export default function MapboxMap({
  initialLat = 23.8103, // Dhaka default
  initialLng = 90.4125,
  zoom = 12,
  interactive = true,
  onLocationSelect,
  onMarkerClick,
  markers = [],
  className = "h-[380px] w-full rounded-xl overflow-hidden shadow-inner border border-border/50",
  showLegend = true,
  showRecenterButton = true,
}: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const currentMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const pickerMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  );

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // Function to fit map to all active markers
  const fitToMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const valid = markers.filter(
      (m) =>
        m.latitude != null &&
        m.longitude != null &&
        !isNaN(m.latitude) &&
        !isNaN(m.longitude),
    );

    if (valid.length === 1) {
      map.flyTo({
        center: [valid[0].longitude, valid[0].latitude],
        zoom: 14,
        duration: 1000,
      });
    } else if (valid.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      valid.forEach((m) => bounds.extend([m.longitude, m.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
    } else {
      map.flyTo({
        center: [initialLng, initialLat],
        zoom: zoom,
        duration: 800,
      });
    }
  }, [markers, initialLat, initialLng, zoom]);

  // 1. Initialize Map instance once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (token) {
      mapboxgl.accessToken = token;
    }

    const mapStyle: mapboxgl.Style | string = token
      ? "mapbox://styles/mapbox/dark-v11"
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
        attributionControl: false,
      });

      mapRef.current = map;

      if (interactive) {
        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: true }),
          "top-right",
        );
      }

      map.on("load", () => {
        setMapLoaded(true);
      });

      // Location picker mode
      if (interactive && onLocationSelect) {
        if (initialLat && initialLng) {
          const el = document.createElement("div");
          el.className = "picker-marker-container";
          el.innerHTML = `
            <div style="cursor: grab; display: flex; flex-direction: column; align-items: center;">
              <div style="background: #F59E0B; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(245,158,11,0.5); border: 2px solid #FFFFFF;">
                <div style="transform: rotate(45deg); width: 8px; height: 8px; border-radius: 50%; background: #000;"></div>
              </div>
            </div>
          `;

          const marker = new mapboxgl.Marker({
            element: el,
            draggable: true,
          })
            .setLngLat([initialLng, initialLat])
            .addTo(map);

          pickerMarkerRef.current = marker;

          marker.on("dragend", () => {
            const lngLat = marker.getLngLat();
            setSelectedCoords({ lat: lngLat.lat, lng: lngLat.lng });
            onLocationSelect(lngLat.lat, lngLat.lng);
          });
        }

        map.on("click", (e) => {
          const { lat, lng } = e.lngLat;
          setSelectedCoords({ lat, lng });

          if (pickerMarkerRef.current) {
            pickerMarkerRef.current.setLngLat([lng, lat]);
          } else {
            const el = document.createElement("div");
            el.className = "picker-marker-container";
            el.innerHTML = `
              <div style="cursor: grab; display: flex; flex-direction: column; align-items: center;">
                <div style="background: #F59E0B; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(245,158,11,0.5); border: 2px solid #FFFFFF;">
                  <div style="transform: rotate(45deg); width: 8px; height: 8px; border-radius: 50%; background: #000;"></div>
                </div>
              </div>
            `;
            const marker = new mapboxgl.Marker({
              element: el,
              draggable: true,
            })
              .setLngLat([lng, lat])
              .addTo(map);

            pickerMarkerRef.current = marker;

            marker.on("dragend", () => {
              const newLngLat = marker.getLngLat();
              setSelectedCoords({ lat: newLngLat.lat, lng: newLngLat.lng });
              onLocationSelect(newLngLat.lat, newLngLat.lng);
            });
          }

          onLocationSelect(lat, lng);
        });
      }
    } catch (e) {
      console.warn("Mapbox initialization fallback error:", e);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialLat, initialLng, zoom, interactive, token]);

  // 2. Render Markers whenever markers or mapLoaded changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    currentMarkersRef.current.forEach((m) => m.remove());
    currentMarkersRef.current = [];

    const validMarkers = markers.filter(
      (m) =>
        m.latitude != null &&
        m.longitude != null &&
        !isNaN(m.latitude) &&
        !isNaN(m.longitude),
    );

    if (validMarkers.length === 0) return;

    validMarkers.forEach((item) => {
      const sev = getSeverityConfig(item.severity);
      const st = getStatusBadgeStyle(item.status);

      // Create Custom HTML Pin Element
      const el = document.createElement("div");
      el.className = "civic-map-marker group";
      el.style.cssText =
        "cursor: pointer; display: flex; flex-direction: column; align-items: center; position: relative;";

      // Pulse ring for critical alerts
      const pulseHtml = sev.isPulse
        ? `<div style="position: absolute; top: -6px; left: -6px; width: 44px; height: 44px; border-radius: 50%; background: ${sev.bg}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
        : "";

      el.innerHTML = `
        ${pulseHtml}
        <div style="position: relative; z-index: 10; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; background: ${sev.bg}; border: 2.5px solid #FFFFFF; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.45); transition: transform 0.2s ease;">
          <div style="transform: rotate(45deg); font-size: 11px; font-weight: 800; color: #FFFFFF; font-family: monospace;">
            ${item.category ? item.category.slice(0, 1).toUpperCase() : "!"}
          </div>
        </div>
        <div style="position: relative; z-index: 11; margin-top: -6px; width: 8px; height: 8px; border-radius: 50%; background: ${st.text}; border: 1.5px solid #000;"></div>
      `;

      // Hover scale
      el.addEventListener("mouseenter", () => {
        const pin = el.querySelector("div[style*='rotate(-45deg)']") as HTMLElement;
        if (pin) pin.style.transform = "rotate(-45deg) scale(1.15)";
      });
      el.addEventListener("mouseleave", () => {
        const pin = el.querySelector("div[style*='rotate(-45deg)']") as HTMLElement;
        if (pin) pin.style.transform = "rotate(-45deg) scale(1)";
      });

      // Construct rich popup
      const popupHtml = `
        <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 220px; max-width: 280px; color: #E2E8F0; background: #0F172A; border-radius: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${sev.badgeBg}; color: ${sev.bg}; border: 1px solid ${sev.badgeBorder}; font-family: monospace;">
              ${sev.label}
            </span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${st.bg}; color: ${st.text};">
              ${st.label}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #FFFFFF; line-height: 1.3;">
            ${escapeHtml(item.title)}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #94A3B8;">
            📍 ${escapeHtml(item.locationName || item.category)}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #1E293B; margin-top: 4px;">
            <span style="font-size: 10px; color: #64748B; font-family: monospace;">
              ${escapeHtml(item.category)}
            </span>
            <a href="/complaints?id=${encodeURIComponent(item.id)}" style="font-size: 11px; font-weight: 600; color: #F59E0B; text-decoration: none;">
              Inspect Case →
            </a>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: true,
        className: "civic-dark-popup",
        maxWidth: "320px",
      }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([item.longitude, item.latitude])
        .setPopup(popup)
        .addTo(map);

      if (onMarkerClick) {
        el.addEventListener("click", () => {
          onMarkerClick(item.id);
        });
      }

      currentMarkersRef.current.push(marker);
    });

    // Auto fit bounds to markers so they are guaranteed visible
    if (validMarkers.length === 1) {
      map.flyTo({
        center: [validMarkers[0].longitude, validMarkers[0].latitude],
        zoom: 14,
        duration: 800,
      });
    } else if (validMarkers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      validMarkers.forEach((m) => bounds.extend([m.longitude, m.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
    }
  }, [markers, onMarkerClick]);

  return (
    <div className="relative w-full group">
      <div ref={mapContainerRef} className={className} />

      {/* Selected Coordinates Badge for Picker Mode */}
      {interactive && selectedCoords && onLocationSelect && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-[#27354A] bg-[#0B1120]/90 px-3 py-1.5 font-mono text-xs text-amber-400 shadow-xl backdrop-blur-md">
          <IconMapPin className="size-3.5 text-amber-400 animate-pulse" />
          <span>
            {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
          </span>
        </div>
      )}

      {/* Floating Map Legend & Indication Overlay */}
      {showLegend && markers.length > 0 && (
        <div className="absolute top-3 left-3 z-10 hidden sm:flex items-center gap-3 rounded-lg border border-[#27354A]/80 bg-[#0B1120]/90 px-3 py-1.5 text-[11px] font-medium text-gray-300 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>Critical ({markers.filter((m) => m.severity === "CRITICAL").length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <span>High ({markers.filter((m) => m.severity === "HIGH").length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" />
            <span>Medium ({markers.filter((m) => m.severity === "MEDIUM").length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Low ({markers.filter((m) => m.severity === "LOW").length})</span>
          </div>
        </div>
      )}

      {/* Floating Recenter View Button */}
      {showRecenterButton && markers.length > 0 && (
        <button
          type="button"
          onClick={fitToMarkers}
          title="Fit view to all active complaints"
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-[#27354A] bg-[#0B1120]/90 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:text-amber-400 hover:border-amber-500/50 shadow-xl backdrop-blur-md transition"
        >
          <IconFocusCentered className="size-3.5 text-amber-400" />
          <span>Fit All ({markers.length})</span>
        </button>
      )}
    </div>
  );
}
