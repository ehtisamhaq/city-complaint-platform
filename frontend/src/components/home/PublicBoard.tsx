"use client";

import {
  IconArrowRight,
  IconBrandAndroid,
  IconBrandApple,
  IconCheck,
  IconCurrentLocation,
  IconMapPin,
  IconSearch,
  IconShieldCheck,
  IconThumbUp,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import {
  categoryLabel,
  categoryShortLabels,
  SeverityBadge,
  StatusBadge,
} from "@/components/Badges";
import ReportModal from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
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
    <div className="h-[360px] w-full animate-pulse rounded-xl bg-[#111827] border border-[#27354A]" />
  ),
});

/**
 * Recharts and its d3 dependencies add roughly 380 KB, which was landing in
 * the home page's initial chunk. The chart is below the fold, so it is loaded
 * on demand and the grid above it paints without waiting for the library.
 */
const AnalyticsCharts = dynamic(() => import("@/components/AnalyticsCharts"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="mt-6 h-64 w-full animate-pulse rounded-xl bg-[#111827] border border-[#27354A]"
    />
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

/**
 * `now` is the server-supplied snapshot time, not the wall clock: reading the
 * clock during render breaks static prerendering.
 */
function formatRelative(value: string, now: number) {
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

const RECENT_PAGE_SIZE = 30;

interface PublicBoardProps {
  initialStats: PublicStatisticsData;
  initialComplaints: Complaint[];
  snapshotTime: number;
}

export default function PublicBoard({
  initialStats,
  initialComplaints,
  snapshotTime,
}: PublicBoardProps) {
  // Both datasets arrive from the server's cached fetches, so the board is
  // fully populated on first paint instead of filling in after hydration.
  const [statsData, setStatsData] =
    useState<PublicStatisticsData>(initialStats);
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");

  // Quick report widget state
  const [widgetCategory, setWidgetCategory] = useState("ROADS");
  const [widgetLocation, setWidgetLocation] = useState("");
  const [widgetLocating, setWidgetLocating] = useState(false);

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState("ROADS");
  const [reportLocation, setReportLocation] = useState("");

  const openReport = (category?: string, location?: string) => {
    if (category) setReportCategory(category);
    setReportLocation(location ?? "");
    setReportOpen(true);
  };

  // Endorsements — real counts from the backend, see useEndorsements.
  const {
    countFor: endorseCount,
    endorse: endorseComplaintItem,
    endorsed: endorsedIds,
    pending: endorsingIds,
  } = useEndorsements();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        publicApi.getStats(),
        publicApi.getComplaints({ page: 0, size: RECENT_PAGE_SIZE }),
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

  const handleUseGPS = () => {
    if (!navigator.geolocation) return;
    setWidgetLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setWidgetLocation(
          `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Dhaka)`,
        );
        setWidgetLocating(false);
      },
      () => {
        setWidgetLocation("Dhanmondi Lake Road, Ward 15");
        setWidgetLocating(false);
      },
      { timeout: 5000 },
    );
  };

  const handleQuickReport = (e: React.FormEvent) => {
    e.preventDefault();
    openReport(widgetCategory, widgetLocation.trim());
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return complaints.filter((item) => {
      const matchesTerm =
        !term ||
        item.title?.toLowerCase().includes(term) ||
        item.locationName?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term);
      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesSeverity =
        selectedSeverity === "ALL" || item.severity === selectedSeverity;
      return matchesTerm && matchesCategory && matchesSeverity;
    });
  }, [complaints, search, selectedCategory, selectedSeverity]);

  const markers = useMemo(
    () =>
      complaints
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
    [complaints],
  );

  const stats = statsData?.stats;
  const totalComplaints = stats?.totalComplaints ?? 12406;

  return (
    <>
      <main className="flex-1">
        {/* ── 1. Hero Section ────────────────────────────────────────── */}
        <section className="relative min-h-[720px] lg:min-h-[800px] flex items-center justify-center overflow-hidden border-b border-[#27354A]">
          {/* Background Image & Vignette / Gradient Overlays */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center brightness-[0.38] contrast-[1.15] scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2000&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/75 to-[#0B1120]/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/95 via-transparent to-[#0B1120]/85" />
          </div>

          {/* Hero Main Content Grid */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Primary Copy */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                <div className="inline-flex items-center space-x-2 text-amber-400 font-medium text-sm sm:text-base tracking-wide">
                  <span className="size-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Serving 10 city zones, around the clock</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] font-heading">
                  Dhaka doesn&apos;t fix itself.{" "}
                  <span className="text-amber-400 inline-block">
                    Report it.
                  </span>
                </h1>

                <p className="text-gray-300 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl">
                  Potholes, broken streetlights, blocked drains, missed
                  collections — tell us where, and Nagar routes it straight to
                  the department responsible. No phone queues, no lost
                  paperwork.
                </p>

                {/* Key Service Highlights */}
                <div className="pt-4 flex flex-wrap items-center gap-6 text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <IconCheck className="size-4 text-amber-400" />
                    <span>Automated DNCC & DSCC Routing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconCheck className="size-4 text-amber-400" />
                    <span>Live SMS Ticket Updates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconCheck className="size-4 text-amber-400" />
                    <span>Verified Before & After Proof</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Instant Civic Dispatch Card */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center lg:items-end">
                <div className="w-full max-w-md bg-[#131b2e]/95 backdrop-blur-xl border border-[#27354A]/90 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/80">
                  <div className="flex items-center justify-between mb-5 border-b border-[#27354A]/60 pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h3 className="text-white font-semibold text-base tracking-wide font-heading">
                        Instant Civic Dispatch
                      </h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      24/7 Portal
                    </span>
                  </div>

                  {/* Quick Form */}
                  <form onSubmit={handleQuickReport} className="space-y-4">
                    <div>
                      <label
                        htmlFor="quick-report-category"
                        className="block text-xs font-medium text-gray-300 mb-2"
                      >
                        Category
                      </label>
                      <select
                        id="quick-report-category"
                        value={widgetCategory}
                        onChange={(e) => setWidgetCategory(e.target.value)}
                        className="w-full bg-[#090d17] border border-[#233148] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                      >
                        <option value="ROADS">Pothole / road damage</option>
                        <option value="LIGHTING">
                          Broken streetlight / dark alley
                        </option>
                        <option value="WATER">
                          Blocked storm drain / waterlogging
                        </option>
                        <option value="WASTE">
                          Missed garbage pickup / open dump
                        </option>
                        <option value="TRAFFIC">
                          Traffic signal failure / damaged sign
                        </option>
                        <option value="PARKS">
                          Parks, fallen trees & sidewalk hazards
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="quick-report-location"
                        className="block text-xs font-medium text-gray-300 mb-2"
                      >
                        Location
                      </label>
                      <div className="relative">
                        <input
                          id="quick-report-location"
                          type="text"
                          value={widgetLocation}
                          onChange={(e) => setWidgetLocation(e.target.value)}
                          placeholder="Road, area or ward"
                          className="w-full bg-[#090d17] border border-[#233148] rounded-xl px-4 py-3.5 pr-10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                        <button
                          type="button"
                          onClick={handleUseGPS}
                          disabled={widgetLocating}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-amber-400 transition"
                          title="Use Current GPS Location"
                        >
                          <IconCurrentLocation
                            className={cn(
                              "size-4",
                              widgetLocating && "animate-spin text-amber-400",
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-gray-950 font-bold text-base rounded-xl transition duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
                      >
                        <span>Report an issue</span>
                        <IconArrowRight className="size-4" />
                      </Button>
                    </div>
                  </form>

                  {/* Trust Badge */}
                  <div className="mt-5 pt-4 border-t border-[#27354A]/60 flex items-center justify-center space-x-2 text-xs text-gray-300">
                    <IconShieldCheck className="size-4 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-white font-mono">
                        {totalComplaints.toLocaleString()}
                      </strong>{" "}
                      issues resolved across Dhaka since launch
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Statistics Ticker Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-[#080d19]/95 border-t border-[#27354A]/70 py-3.5 px-4 backdrop-blur-md z-20">
            <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-8 text-xs font-semibold uppercase tracking-wider">
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="text-gray-400">TRAFFIC SIGNALS</span>
                <span className="text-amber-400 text-sm font-bold font-mono">
                  19
                </span>
                <span className="text-emerald-400 text-[11px] font-normal lowercase flex items-center">
                  ▼ 1 today
                </span>
              </div>
              <div className="w-px h-4 bg-[#27354A] hidden md:block" />
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="text-gray-400">POTHOLES</span>
                <span className="text-amber-400 text-sm font-bold font-mono">
                  240
                </span>
                <span className="text-emerald-400 text-[11px] font-normal lowercase flex items-center">
                  ▼ 14 today
                </span>
              </div>
              <div className="w-px h-4 bg-[#27354A] hidden md:block" />
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="text-gray-400">STREETLIGHTS</span>
                <span className="text-amber-400 text-sm font-bold font-mono">
                  82
                </span>
                <span className="text-emerald-400 text-[11px] font-normal lowercase flex items-center">
                  ▼ 6 today
                </span>
              </div>
              <div className="w-px h-4 bg-[#27354A] hidden md:block" />
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="text-gray-400">DRAINAGE CLEARANCES</span>
                <span className="text-amber-400 text-sm font-bold font-mono">
                  45
                </span>
                <span className="text-emerald-400 text-[11px] font-normal lowercase flex items-center">
                  ▼ 9 today
                </span>
              </div>
              <div className="w-px h-4 bg-[#27354A] hidden lg:block" />
              <div className="hidden lg:flex items-center space-x-2 whitespace-nowrap">
                <span className="text-gray-400">AVG RESPONSE</span>
                <span className="text-white text-sm font-bold font-mono">
                  2.4 HOURS
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. How It Works Section ─────────────────────────────────── */}
        <section
          className="py-24 bg-[#0B1120] border-b border-[#27354A] relative bg-grid-pattern"
          id="how-it-works"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-amber-400 uppercase tracking-wider text-xs font-bold font-mono">
                Accountable Governance
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
                How Nagar Resolves Dhaka&apos;s Daily Friction
              </h2>
              <p className="mt-4 text-gray-400 text-base">
                Direct routing to field officers across Zone 1 to Zone 10 with
                guaranteed SLA timestamps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-[#111827] border border-[#27354A] rounded-2xl p-8 relative flex flex-col justify-between hover:border-amber-500/40 transition group">
                <div>
                  <div className="size-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-lg mb-6 font-mono group-hover:scale-105 transition-transform">
                    01
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 font-heading">
                    Snap & Pin
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Take a quick photo on your mobile phone and drop a pin on
                    your ward. Our system automatically captures geo-coordinates
                    and timestamp tags.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#27354A]/60 text-xs text-amber-400 font-semibold flex items-center">
                  No registration required for emergencies →
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#111827] border border-[#27354A] rounded-2xl p-8 relative flex flex-col justify-between hover:border-amber-500/40 transition group">
                <div>
                  <div className="size-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-lg mb-6 font-mono group-hover:scale-105 transition-transform">
                    02
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 font-heading">
                    Smart Dept Routing
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Nagar AI triages severity and assigns the ticket instantly
                    to the responsible zonal municipal department (DNCC/DSCC,
                    WASA, or DESCO).
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#27354A]/60 text-xs text-amber-400 font-semibold flex items-center">
                  Direct dispatch to ward inspectors →
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#111827] border border-[#27354A] rounded-2xl p-8 relative flex flex-col justify-between hover:border-amber-500/40 transition group">
                <div>
                  <div className="size-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-lg mb-6 font-mono group-hover:scale-105 transition-transform">
                    03
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 font-heading">
                    Track to Resolution
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Receive live SMS progress updates. Once the crew fixes the
                    issue, field officers upload verified photographic evidence
                    before ticket closure.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#27354A]/60 text-xs text-amber-400 font-semibold flex items-center">
                  Citizen audit & satisfaction sign-off →
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Live Map & Operations Feed ─────────────────────────── */}
        <section
          className="py-24 bg-[#0a0f1c] border-b border-[#27354A]"
          id="live-map"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
              <div>
                <span className="text-amber-400 uppercase tracking-wider text-xs font-bold font-mono">
                  Public Oversight
                </span>
                <h2 className="text-3xl font-extrabold text-white mt-1 font-heading">
                  Live City Operations Feed
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  Explore active work orders, geotagged reports, and verified
                  completed repairs across Dhaka.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    selectedCategory === "ALL"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-gray-300 hover:text-white border border-[#27354A]",
                  )}
                >
                  All Reports
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      selectedCategory === cat
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-800 text-gray-300 hover:text-white border border-[#27354A]",
                    )}
                  >
                    {categoryShortLabels[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Preview */}
            <div className="mb-10 rounded-2xl overflow-hidden border border-[#27354A] shadow-xl bg-[#111827]">
              <div className="px-5 py-3 border-b border-[#27354A] flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Geotagged Incidents:{" "}
                  <strong className="text-white font-mono">
                    {markers.length}
                  </strong>{" "}
                  points plotted
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-amber-400 hidden sm:inline">
                    Dhaka Metropolitan Grid
                  </span>
                  <Link
                    href="/complaints"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition"
                  >
                    <span>Full Screen Registry</span>
                    <IconArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
              <MapboxMap
                markers={markers}
                interactive={true}
                className="h-[360px] sm:h-[450px] w-full"
              />
            </div>

            {/* Search Bar for cases */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter cases by title, road, or area..."
                  className="w-full bg-[#111827] border border-[#27354A] rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="bg-[#111827] border border-[#27354A] rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical Alert</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Recent Resolution Cards Grid */}
            {refreshing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2, 3, 4, 5].map((key) => (
                  <Skeleton
                    key={key}
                    className="h-56 w-full rounded-xl bg-slate-800/60"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#27354A] p-12 text-center">
                <IconSearch className="size-8 mx-auto text-gray-500 mb-3" />
                <h4 className="text-white font-semibold">
                  No cases match your filters
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Try clearing your search term or category filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filtered.map((item) => {
                  const count = endorseCount(item);
                  const isEndorsed = endorsedIds.has(item.id);
                  const ticketNumber = `#DN-${item.id.replace(/[^0-9]/g, "").slice(0, 4) || "8491"}`;
                  return (
                    <article
                      key={item.id}
                      className="bg-[#111827] rounded-xl border border-[#27354A] p-5 flex flex-col justify-between hover:border-amber-500/40 transition group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <StatusBadge status={item.status} />
                          <span className="text-gray-400 font-mono text-[11px]">
                            {formatRelative(item.createdAt, snapshotTime)}
                          </span>
                        </div>
                        <div className="mb-2">
                          <SeverityBadge severity={item.severity} />
                        </div>
                        <h4 className="text-white font-bold text-base mb-1 font-heading group-hover:text-amber-400 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-gray-400 text-xs mb-4 flex items-center gap-1">
                          <IconMapPin className="size-3 text-amber-400 shrink-0" />
                          <span className="truncate">
                            {item.locationName || categoryLabel(item.category)}
                          </span>
                        </p>
                        {item.photoUrl && (
                          <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg border border-[#27354A]">
                            <Image
                              src={item.photoUrl}
                              alt="Complaint evidence"
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-3 bg-[#0d1527] rounded-lg border border-[#27354A]/60 text-xs text-gray-300 mb-4 line-clamp-3">
                          <span className="text-gray-400 block mb-1 font-medium">
                            Description:
                          </span>
                          {item.description}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#27354A]/60 space-y-3">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>
                            Ticket:{" "}
                            <strong className="text-white font-mono">
                              {ticketNumber}
                            </strong>
                          </span>
                          <span className="text-amber-400 font-medium font-mono">
                            Turnaround:{" "}
                            {item.severity === "CRITICAL" ? "4h" : "18h"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => endorseComplaintItem(item)}
                          disabled={isEndorsed || endorsingIds.has(item.id)}
                          className={cn(
                            "w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border disabled:cursor-default",
                            isEndorsed
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                              : "bg-slate-800/80 text-gray-300 border-[#27354A] hover:bg-slate-700/80 hover:text-white",
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
          </div>
        </section>

        {/* ── 4. Civic Impact Metrics ─────────────────────────────────── */}
        <section
          className="py-20 bg-[#0B1120] border-b border-[#27354A]"
          id="transparency"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-[#1E293B] via-[#0f172a] to-[#1E293B] border border-[#27354A] rounded-2xl p-8 sm:p-12 shadow-xl mb-12">
              <div className="max-w-2xl mb-10">
                <span className="text-amber-400 uppercase tracking-wider text-xs font-bold font-mono">
                  Open Data Standards
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-heading">
                  Real-Time City Performance Metrics
                </h3>
                <p className="text-gray-400 text-sm mt-2">
                  Every citizen complaint is logged publicly to ensure
                  transparency, municipal accountability, and SLA adherence.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="border-l-2 border-amber-400 pl-4">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    34 Hours
                  </span>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Average Resolution Time
                  </p>
                </div>
                <div className="border-l-2 border-amber-400 pl-4">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    54 Wards
                  </span>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    10 Zones Fully Integrated
                  </p>
                </div>
                <div className="border-l-2 border-amber-400 pl-4">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    3,820+
                  </span>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Monthly Work Orders Closed
                  </p>
                </div>
                <div className="border-l-2 border-amber-400 pl-4">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    94.2%
                  </span>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Citizen Approval Rating
                  </p>
                </div>
              </div>
            </div>

            {/* Recharts Analytics Breakdown */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-white font-heading">
                    Department Workload & Resolutions
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Public telemetry by municipal service sector
                  </p>
                </div>
                <a
                  href="/api/public/export/json"
                  className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
                >
                  Download Open Data (JSON) →
                </a>
              </div>
              {refreshing ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Skeleton className="h-72 w-full rounded-xl bg-slate-800" />
                  <Skeleton className="h-72 w-full rounded-xl bg-slate-800" />
                </div>
              ) : (
                <AnalyticsCharts
                  byCategory={statsData?.byCategory ?? {}}
                  byDepartment={statsData?.byDepartment ?? []}
                />
              )}
            </div>
          </div>
        </section>

        {/* ── 5. Quick Mobile Banner ─────────────────────────────────── */}
        <section className="py-16 bg-[#0a0f1d] border-b border-[#27354A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#111827] border border-[#27354A]/80 rounded-2xl p-8 sm:p-10">
              <div className="max-w-xl">
                <h3 className="text-2xl font-bold text-white font-heading">
                  Keep Nagar in your pocket
                </h3>
                <p className="text-gray-400 text-sm mt-2">
                  Download the lightweight citizen app to receive instantaneous
                  push alerts when city repair crews arrive at your reported
                  street.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() =>
                    alert("Mobile app link will be sent to your phone.")
                  }
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-[#27354A] text-white text-sm font-semibold flex items-center space-x-2 transition"
                >
                  <IconBrandApple className="size-5 text-amber-400" />
                  <span>Apple App Store</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    alert("Mobile app link will be sent to your phone.")
                  }
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-[#27354A] text-white text-sm font-semibold flex items-center space-x-2 transition"
                >
                  <IconBrandAndroid className="size-5 text-amber-400" />
                  <span>Google Play</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── 6. Site Footer ─────────────────────────────────────────── */}
      <footer className="bg-[#070b14] border-t border-[#27354A] text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Column 1: Brand & Municipal Scope */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="size-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold font-heading">
                  N
                </div>
                <span className="text-xl font-bold text-white tracking-tight font-heading">
                  NAGAR CIVIC
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                Empowering Dhaka&apos;s citizens with transparent, trackable
                municipal infrastructure reporting. Built for DNCC, DSCC, and
                integrated utility providers.
              </p>
              <div className="flex items-center space-x-3 pt-2 text-xs text-gray-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Municipal Systems Operational</span>
              </div>
            </div>

            {/* Column 2: Emergency Helplines */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 font-heading">
                Emergency & Dial
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <span className="text-gray-400">National Helpline:</span>{" "}
                  <strong className="text-amber-400 font-mono">333</strong>
                </li>
                <li>
                  <span className="text-gray-400">DNCC Call Center:</span>{" "}
                  <strong className="text-amber-400 font-mono">16107</strong>
                </li>
                <li>
                  <span className="text-gray-400">DSCC Control Room:</span>{" "}
                  <strong className="text-amber-400 font-mono">
                    02-9556014
                  </strong>
                </li>
                <li>
                  <span className="text-gray-400">Dhaka WASA:</span>{" "}
                  <strong className="text-amber-400 font-mono">16162</strong>
                </li>
              </ul>
            </div>

            {/* Column 3: Quick Navigation */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 font-heading">
                Portals
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => openReport("ROADS")}
                    className="hover:text-amber-400 transition cursor-pointer"
                  >
                    Report a Pothole
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openReport("LIGHTING")}
                    className="hover:text-amber-400 transition cursor-pointer"
                  >
                    Streetlight Outage
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openReport("WATER")}
                    className="hover:text-amber-400 transition cursor-pointer"
                  >
                    Drainage &amp; Monsoon Desk
                  </button>
                </li>
                <li>
                  <Link
                    href="/citizen/dashboard"
                    className="hover:text-amber-400 transition"
                  >
                    Citizen Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/staff/dashboard"
                    className="hover:text-amber-400 transition"
                  >
                    Municipal Ops Console
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Civic Transparency */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 font-heading">
                Accountability
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/rag" className="hover:text-amber-400 transition">
                    Zone Resolution SLAs
                  </Link>
                </li>
                <li>
                  <a
                    href="/api/public/export/json"
                    className="hover:text-amber-400 transition"
                  >
                    Municipal Open API
                  </a>
                </li>
                <li>
                  <Link href="/rag" className="hover:text-amber-400 transition">
                    Quarterly Audit Reports
                  </Link>
                </li>
                <li>
                  <Link href="/rag" className="hover:text-amber-400 transition">
                    Privacy & Citizen Rights
                  </Link>
                </li>
                <li>
                  <Link href="/rag" className="hover:text-amber-400 transition">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom Copyright */}
          <div className="pt-8 border-t border-[#27354A]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
            <p>
              © 2026 Nagar Civic Platform. Developed for the Greater Dhaka
              Metropolitan Area.
            </p>
            <p className="flex items-center space-x-1">
              <span>Serving with integrity for a cleaner, safer capital.</span>
            </p>
          </div>
        </div>
      </footer>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        initialCategory={reportCategory}
        initialLocationName={reportLocation}
        onSuccess={refresh}
      />
    </>
  );
}
