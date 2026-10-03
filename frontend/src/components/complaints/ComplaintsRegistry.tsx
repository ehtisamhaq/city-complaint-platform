"use client";

import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconEye,
  IconFlame,
  IconLayoutGrid,
  IconLayoutList,
  IconMap,
  IconMapPin,
  IconRefresh,
  IconSearch,
  IconSparkles,
  IconThumbUp,
  IconX,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { categoryLabel, SeverityBadge, StatusBadge } from "@/components/Badges";
import ReportModal from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useEndorsements } from "@/hooks/useEndorsements";
import {
  type Complaint,
  type PublicStatisticsData,
  publicApi,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] w-full animate-pulse rounded-xl bg-[#111827] border border-[#27354A]" />
  ),
});

const CATEGORIES = [
  "ROADS",
  "WATER",
  "LIGHTING",
  "WASTE",
  "PARKS",
  "TRAFFIC",
] as const;

const STATUSES = [
  "ALL",
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
] as const;

const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * `now` is the server-supplied snapshot time, not the wall clock: reading the
 * clock during render breaks static prerendering.
 */
function formatRelative(value: string | undefined, now: number) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffHours = Math.max(
    1,
    Math.round((now - date.getTime()) / (1000 * 60 * 60)),
  );
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

interface ComplaintsRegistryProps {
  initialComplaints: Complaint[];
  initialStats: PublicStatisticsData;
  initialCategory: string;
  initialStatus: string;
  initialSeverity: string;
  highlightId: string | null;
  snapshotTime: number;
}

export default function ComplaintsRegistry({
  initialComplaints,
  initialStats,
  initialCategory,
  initialStatus,
  initialSeverity,
  highlightId,
  snapshotTime,
}: ComplaintsRegistryProps) {
  // Both lists arrive pre-rendered from the server's cached fetches, so the
  // registry is never empty on first paint.
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [statsData, setStatsData] =
    useState<PublicStatisticsData>(initialStats);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(initialCategory);
  const [status, setStatus] = useState<string>(initialStatus);
  const [severity, setSeverity] = useState<string>(initialSeverity);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "severity">(
    "newest",
  );

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "table" | "map">("grid");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    () =>
      highlightId
        ? (initialComplaints.find((c) => c.id === highlightId) ?? null)
        : null,
  );

  // Endorsements — real counts from the backend, see useEndorsements.
  const {
    countFor: endorseCount,
    endorse: endorseComplaintItem,
    endorsed: endorsedIds,
    pending: endorsingIds,
  } = useEndorsements();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        publicApi.getStats(),
        publicApi.getComplaints({ page: 0, size: 100 }),
      ]);
      setStatsData(statsRes.data);
      const list = complaintsRes.data?.content ?? [];
      setComplaints(list);
    } catch {
      // The cached server render is still on screen; a failed refresh just
      // leaves it as-is.
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Filter & sort logic
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = complaints.filter((item) => {
      const matchesSearch =
        !term ||
        item.title?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.locationName?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.id?.toLowerCase().includes(term);

      const matchesCat = category === "ALL" || item.category === category;
      const matchesStatus = status === "ALL" || item.status === status;
      const matchesSev = severity === "ALL" || item.severity === severity;

      return matchesSearch && matchesCat && matchesStatus && matchesSev;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "severity") {
        const order: Record<string, number> = {
          CRITICAL: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        const diff = (order[b.severity] || 0) - (order[a.severity] || 0);
        if (diff !== 0) return diff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [complaints, search, category, status, severity, sortBy]);

  // Paginated items
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Map markers from filtered complaints
  const mapMarkers = useMemo(
    () =>
      filtered
        .filter((item) => item.latitude != null && item.longitude != null)
        .map((item) => ({
          id: item.id,
          latitude: item.latitude as number,
          longitude: item.longitude as number,
          title: item.title,
          category: item.category,
          severity: item.severity,
          status: item.status,
          locationName: item.locationName,
        })),
    [filtered],
  );

  const stats = statsData?.stats;
  const totalComplaints = stats?.totalComplaints ?? complaints.length;
  const inProgressCount =
    stats?.inProgress ??
    complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount =
    stats?.resolved ??
    complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED")
      .length;
  const criticalCount = complaints.filter(
    (c) => c.severity === "CRITICAL",
  ).length;

  return (
    <>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#27354A]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-amber-400 font-mono text-xs uppercase font-bold tracking-wider">
                Public Oversight & Transparency
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
              Municipal Complaint Registry
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-2xl leading-relaxed">
              Explore geotagged infrastructure reports, track live department
              assignments, and inspect verified repairs across all 10 Dhaka
              municipal zones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setReportOpen(true)}
              className="gap-2 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 shadow-lg shadow-amber-500/20"
            >
              <IconSparkles className="size-4" />
              <span>Report New Issue</span>
            </Button>
            <a
              href="/api/public/export/csv"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#27354A] bg-[#111827] hover:bg-[#1A2337] text-xs font-semibold text-gray-300 hover:text-white transition"
              title="Download CSV export"
            >
              <IconDownload className="size-4 text-amber-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </a>
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              disabled={refreshing}
              title="Refresh complaints"
              className="border-[#27354A] bg-[#111827] text-gray-300 hover:text-white"
            >
              <IconRefresh
                className={cn(
                  "size-4",
                  refreshing && "animate-spin text-amber-400",
                )}
              />
            </Button>
          </div>
        </div>

        {/* ── Key Metrics Ticker ───────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-[#27354A] rounded-xl p-4.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Total Registry Cases</span>
              <span className="font-mono text-amber-400 text-[10px] uppercase font-bold">
                DNCC/DSCC
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {totalComplaints.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">logged</span>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#27354A] rounded-xl p-4.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Active In Progress</span>
              <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
                {inProgressCount.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">crews dispatched</span>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#27354A] rounded-xl p-4.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Verified Resolved</span>
              <IconCheck className="size-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                {resolvedCount.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">completed</span>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#27354A] rounded-xl p-4.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Critical Incidents</span>
              <IconFlame className="size-4 text-red-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-red-400 font-mono">
                {criticalCount.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">
                &lt;24h SLA response
              </span>
            </div>
          </div>
        </div>

        {/* ── Filters & Controls Toolbar ──────────────────────────────── */}
        <div className="mt-8 bg-[#111827] border border-[#27354A] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          {/* Top Row: Search + View Modes */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by title, location, category, or ticket ID..."
                className="w-full bg-[#090D17] border border-[#233148] rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  <IconX className="size-4" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#090D17] p-1 rounded-xl border border-[#233148] self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                  viewMode === "grid"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "text-gray-400 hover:text-white",
                )}
                title="Grid view"
              >
                <IconLayoutGrid className="size-4" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                  viewMode === "table"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "text-gray-400 hover:text-white",
                )}
                title="Table view"
              >
                <IconLayoutList className="size-4" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                  viewMode === "map"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "text-gray-400 hover:text-white",
                )}
                title="Map view"
              >
                <IconMap className="size-4" />
                <span>Map ({mapMarkers.length})</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Dropdowns & Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#27354A]/60 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium">Category:</span>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#090D17] border border-[#233148] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium">Status:</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#090D17] border border-[#233148] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">All Statuses</option>
                  {STATUSES.filter((s) => s !== "ALL").map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium">Severity:</span>
                <select
                  value={severity}
                  onChange={(e) => {
                    setSeverity(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#090D17] border border-[#233148] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">All Severities</option>
                  {SEVERITIES.filter((s) => s !== "ALL").map((sev) => (
                    <option key={sev} value={sev}>
                      {sev}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters button */}
              {(category !== "ALL" ||
                status !== "ALL" ||
                severity !== "ALL" ||
                search) && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory("ALL");
                    setStatus("ALL");
                    setSeverity("ALL");
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 ml-1"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "newest" | "oldest" | "severity")
                }
                className="bg-[#090D17] border border-[#233148] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="severity">Highest Severity</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Active Filters Summary Bar ──────────────────────────────── */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400 px-1">
          <span>
            Showing{" "}
            <strong className="text-white font-mono">{filtered.length}</strong>{" "}
            matching complaints
          </span>
          {viewMode !== "map" && (
            <span>
              Page{" "}
              <strong className="text-white font-mono">{currentPage}</strong> of{" "}
              <strong className="text-white font-mono">{totalPages}</strong>
            </span>
          )}
        </div>

        {/* ── Content View Modes ──────────────────────────────────────── */}
        <div className="mt-6">
          {refreshing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <Skeleton
                  key={key}
                  className="h-60 w-full rounded-2xl bg-[#111827] border border-[#27354A]"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#27354A] bg-[#111827]/60 p-16 text-center">
              <IconSearch className="size-10 mx-auto text-gray-500 mb-4" />
              <h3 className="text-lg font-bold text-white font-heading">
                No matching complaints found
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No incidents match your selected filters. Try broadening your
                search keywords or resetting filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCategory("ALL");
                  setStatus("ALL");
                  setSeverity("ALL");
                  setSearch("");
                }}
                className="mt-4 border-[#27354A] text-amber-400 hover:text-white"
              >
                Reset All Filters
              </Button>
            </div>
          ) : viewMode === "map" ? (
            /* ── MAP VIEW ── */
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-[#27354A] bg-[#111827] shadow-2xl">
                <div className="px-5 py-3 border-b border-[#27354A] flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    Plotted Incidents:{" "}
                    <strong className="text-white font-mono">
                      {mapMarkers.length}
                    </strong>
                  </span>
                  <span className="font-mono text-amber-400 text-[11px]">
                    Click any marker to inspect case details
                  </span>
                </div>
                <MapboxMap
                  markers={mapMarkers}
                  interactive={true}
                  className="h-[560px] w-full"
                  onMarkerClick={(id) => {
                    const match = complaints.find((c) => c.id === id);
                    if (match) setSelectedComplaint(match);
                  }}
                />
              </div>

              {/* Bottom Quick Carousel of Plotted Cases */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mapMarkers.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      const match = complaints.find((c) => c.id === m.id);
                      if (match) setSelectedComplaint(match);
                    }}
                    className="p-3.5 rounded-xl bg-[#111827] border border-[#27354A] text-left hover:border-amber-500/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <SeverityBadge severity={m.severity} />
                        <span className="text-[10px] text-gray-400 font-mono">
                          {m.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate">
                        {m.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        📍 {m.locationName || m.category}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-400 mt-2 block">
                      Inspect details →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : viewMode === "table" ? (
            /* ── TABLE VIEW ── */
            <div className="rounded-2xl border border-[#27354A] bg-[#111827] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300 divide-y divide-[#27354A]">
                  <thead className="bg-[#090D17] text-gray-400 uppercase font-mono tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Ticket</th>
                      <th className="py-3.5 px-4 font-semibold">
                        Title & Location
                      </th>
                      <th className="py-3.5 px-4 font-semibold">Category</th>
                      <th className="py-3.5 px-4 font-semibold">Severity</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Reported</th>
                      <th className="py-3.5 px-4 font-semibold text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27354A]/60">
                    {paginatedComplaints.map((item) => {
                      const ticketNumber = `#DN-${item.id.replace(/[^0-9]/g, "").slice(0, 4) || "8491"}`;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#1A2337] transition cursor-pointer"
                          onClick={() => setSelectedComplaint(item)}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                            {ticketNumber}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <span className="block font-semibold text-white truncate">
                              {item.title}
                            </span>
                            <span className="block text-[11px] text-gray-400 truncate">
                              📍 {item.locationName || "Location tagged"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-[#27354A] text-gray-300 font-mono text-[10px]">
                              {categoryLabel(item.category)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <SeverityBadge severity={item.severity} />
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-400">
                            {formatRelative(item.createdAt, snapshotTime)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedComplaint(item);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-semibold transition"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── GRID VIEW ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedComplaints.map((item) => {
                const count = endorseCount(item);
                const isEndorsed = endorsedIds.has(item.id);
                const ticketNumber = `#DN-${item.id.replace(/[^0-9]/g, "").slice(0, 4) || "8491"}`;

                return (
                  <article
                    key={item.id}
                    className="bg-[#111827] rounded-2xl border border-[#27354A] p-5.5 flex flex-col justify-between hover:border-amber-500/40 shadow-lg transition group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <StatusBadge status={item.status} />
                        <span className="text-gray-400 font-mono text-[11px]">
                          {formatRelative(item.createdAt, snapshotTime)}
                        </span>
                      </div>

                      {/* Severity & Category */}
                      <div className="flex items-center gap-2 mb-3">
                        <SeverityBadge severity={item.severity} />
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 border border-[#27354A] text-gray-400">
                          {categoryLabel(item.category)}
                        </span>
                      </div>

                      {/* Title — a real button so the row is keyboard reachable */}
                      <button
                        type="button"
                        onClick={() => setSelectedComplaint(item)}
                        className="text-left text-base font-bold text-white mb-1.5 font-heading group-hover:text-amber-400 transition cursor-pointer"
                      >
                        {item.title}
                      </button>

                      {/* Location */}
                      <p className="text-xs text-gray-400 mb-3.5 flex items-center gap-1.5">
                        <IconMapPin className="size-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                          {item.locationName || "Dhaka Zone"}
                        </span>
                      </p>

                      {/* Description Snippet */}
                      {item.photoUrl && (
                        <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl border border-[#27354A]">
                          <Image
                            src={item.photoUrl}
                            alt="Complaint evidence"
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3 bg-[#090D17] rounded-xl border border-[#27354A]/60 text-xs text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                        {item.description}
                      </div>

                      {/* AI Assessment Pill if available */}
                      {item.aiSummary && (
                        <div className="mb-4 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                          <IconSparkles className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="line-clamp-2 leading-relaxed">
                            {item.aiSummary}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-[#27354A]/60 space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>
                          Ticket:{" "}
                          <strong className="text-white font-mono">
                            {ticketNumber}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedComplaint(item)}
                          className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-xs"
                        >
                          <IconEye className="size-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => endorseComplaintItem(item)}
                        disabled={isEndorsed || endorsingIds.has(item.id)}
                        className={cn(
                          "w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border",
                          isEndorsed
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                            : "bg-[#162032] text-gray-300 border-[#27354A] hover:bg-[#1E2C44] hover:text-white",
                        )}
                      >
                        <IconThumbUp className="size-3.5" />
                        <span>
                          {isEndorsed ? "Endorsed" : "Endorse this fix"}
                        </span>
                        <span className="font-mono ml-1 text-amber-400">
                          ({count})
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── Pagination Controls ───────────────────────────────────── */}
          {viewMode !== "map" && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-[#27354A] bg-[#111827] text-gray-300 hover:text-white"
              >
                <IconArrowLeft className="size-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1 px-3">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "size-8 rounded-lg text-xs font-semibold font-mono transition",
                        currentPage === page
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "text-gray-400 hover:text-white hover:bg-slate-800",
                      )}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="border-[#27354A] bg-[#111827] text-gray-300 hover:text-white"
              >
                Next
                <IconArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Detail Modal ────────────────────────────────────────────── */}
        <Dialog
          open={Boolean(selectedComplaint)}
          onOpenChange={(open) => {
            if (!open) setSelectedComplaint(null);
          }}
        >
          <DialogContent className="max-w-2xl bg-[#0F172A] border-[#27354A] text-gray-100 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {selectedComplaint && (
              <div>
                <DialogHeader className="border-b border-[#27354A] pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedComplaint.status} />
                      <SeverityBadge severity={selectedComplaint.severity} />
                    </div>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      #DN-
                      {selectedComplaint.id
                        .replace(/[^0-9]/g, "")
                        .slice(0, 4) || "8491"}
                    </span>
                  </div>
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-white font-heading">
                    {selectedComplaint.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                    <IconMapPin className="size-3.5 text-amber-400 shrink-0" />
                    <span>
                      {selectedComplaint.locationName || "Tagged Location"}
                    </span>
                    {selectedComplaint.latitude &&
                      selectedComplaint.longitude && (
                        <span className="font-mono text-[10px] text-gray-500">
                          ({selectedComplaint.latitude.toFixed(4)},{" "}
                          {selectedComplaint.longitude.toFixed(4)})
                        </span>
                      )}
                  </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                  {/* AI Triage Analysis */}
                  {selectedComplaint.aiSummary && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                      <div className="flex items-center gap-2 text-amber-400 font-bold font-mono uppercase mb-1">
                        <IconSparkles className="size-4" />
                        <span>AI Rapid Triage &amp; SLA Assessment</span>
                      </div>
                      <p className="text-gray-200 leading-relaxed mt-1">
                        {selectedComplaint.aiSummary}
                      </p>
                    </div>
                  )}

                  {/* Full Description */}
                  {selectedComplaint.photoUrl && (
                    <div>
                      <h4 className="text-xs uppercase font-mono font-semibold text-gray-400 mb-2">
                        Citizen Photo
                      </h4>
                      <div className="relative h-[28rem] w-full overflow-hidden rounded-xl border border-[#233148] bg-[#090D17]">
                        <Image
                          src={selectedComplaint.photoUrl}
                          alt="Photo attached to complaint"
                          fill
                          sizes="(max-width: 768px) 100vw, 672px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs uppercase font-mono font-semibold text-gray-400 mb-2">
                      Citizen Report Narrative
                    </h4>
                    <div className="p-4 rounded-xl bg-[#090D17] border border-[#233148] text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                      {selectedComplaint.description}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#090D17] border border-[#233148] text-xs">
                    <div>
                      <span className="text-gray-500 block">Category</span>
                      <span className="font-semibold text-white mt-0.5 block">
                        {categoryLabel(selectedComplaint.category)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Department</span>
                      <span className="font-semibold text-white mt-0.5 block">
                        {selectedComplaint.departmentName || "Assigned by AI"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Filed On</span>
                      <span className="font-semibold text-white mt-0.5 block">
                        {formatDate(selectedComplaint.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Technician</span>
                      <span className="font-semibold text-white mt-0.5 block">
                        {selectedComplaint.assignedTo?.fullName ||
                          "Field Dispatch Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">
                        Citizen Contact
                      </span>
                      <span className="font-semibold text-white mt-0.5 block">
                        {selectedComplaint.citizen?.fullName ||
                          "Verified Citizen"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">SLA Target</span>
                      <span className="font-mono font-semibold text-amber-400 mt-0.5 block">
                        {selectedComplaint.severity === "CRITICAL"
                          ? "Within 24 Hours"
                          : "Within 48 Hours"}
                      </span>
                    </div>
                  </div>

                  {/* Status Timeline History */}
                  {selectedComplaint.statusHistory &&
                    selectedComplaint.statusHistory.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase font-mono font-semibold text-gray-400 mb-3">
                          Municipal Dispatch Audit Trail
                        </h4>
                        <ol className="relative border-l border-[#27354A] ml-2.5 space-y-4">
                          {selectedComplaint.statusHistory.map((step) => (
                            <li
                              key={`${step.createdAt}-${step.changedBy}-${step.status}`}
                              className="ml-4"
                            >
                              <div className="absolute -left-1.5 mt-1.5 size-3 rounded-full border border-slate-900 bg-amber-500" />
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white uppercase font-mono">
                                  {step.status}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {formatDate(step.createdAt)}
                                </span>
                              </div>
                              {step.note && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {step.note}
                                </p>
                              )}
                              <span className="text-[10px] text-gray-500 block">
                                Handled by: {step.changedBy}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                </div>

                <div className="border-t border-[#27354A] pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => endorseComplaintItem(selectedComplaint)}
                    disabled={
                      endorsedIds.has(selectedComplaint.id) ||
                      endorsingIds.has(selectedComplaint.id)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-semibold text-xs transition"
                  >
                    <IconThumbUp className="size-4" />
                    <span>
                      {endorsedIds.has(selectedComplaint.id)
                        ? "Endorsed"
                        : "Endorse"}{" "}
                      ({endorseCount(selectedComplaint)})
                    </span>
                  </button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedComplaint(null)}
                    className="border-[#27354A] text-gray-300"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSuccess={refresh}
      />
    </>
  );
}
