"use client";

import { Download, MapPin, Search, ThumbsUp } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { SeverityBadge, StatusBadge } from "@/components/Badges";
import Navbar from "@/components/Navbar";
import RagAssistantModal from "@/components/RagAssistantModal";
import {
  type Complaint,
  type PublicStatisticsData,
  publicApi,
  type User,
} from "@/lib/api";
import { getClientUser } from "@/lib/auth";

// Dynamic import for Mapbox to avoid SSR window errors
const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
});

export default function PublicBoardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [statsData, setStatsData] = useState<PublicStatisticsData | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRagOpen, setIsRagOpen] = useState(false);

  // Intent form state
  const [intentInput, setIntentInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState<string | null>(null);

  // Dropzone simulate
  const [cvAnalyzing, setCvAnalyzing] = useState(false);
  const [cvStatus, setCvStatus] = useState<string | null>(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");

  // Community Endorsements
  const [endorsements, setEndorsements] = useState<Record<string, number>>({
    "CP-8610": 54,
    "CP-8594": 38,
  });
  const [endorsedByUser, setEndorsedByUser] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    setUser(getClientUser());
    async function loadPublicData() {
      try {
        const statsRes = await publicApi.getStats();
        setStatsData(statsRes.data);
        const complaintsRes = await publicApi.getComplaints({
          page: 0,
          size: 30,
        });
        const list = complaintsRes.data?.content || [];
        setRecentComplaints(list);

        // Seed initial endorsement counts for real API items
        const initialCounts: Record<string, number> = {
          "CP-8610": 54,
          "CP-8594": 38,
        };
        list.forEach((item, index) => {
          initialCounts[item.id] = ((index * 7 + 3) % 19) + 5;
        });
        setEndorsements(initialCounts);
      } catch (err) {
        console.error("Failed to fetch public statistics", err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicData();
  }, []);

  const toggleEndorse = (id: string) => {
    setEndorsedByUser((prev) => {
      const isEndorsed = !!prev[id];
      setEndorsements((curr) => ({
        ...curr,
        [id]: (curr[id] || 0) + (isEndorsed ? -1 : 1),
      }));
      return { ...prev, [id]: !isEndorsed };
    });
  };

  const handleAnalyzeHazard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intentInput.trim()) return;
    setAnalyzing(true);
    setAnalyzedResult(null);

    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzedResult(
        `AI Telemetry Intake: Registered incident "${intentInput}". Geo-coordinate locked to Ward 4. Ticket CP-8942 generated with High Priority scoring.`,
      );
    }, 900);
  };

  const triggerUploadSimulation = () => {
    setCvAnalyzing(true);
    setCvStatus(null);
    setTimeout(() => {
      setCvAnalyzing(false);
      setCvStatus(
        "Analyzed: Grade 2 Road Cavity • Severity Score 8.4/10 • TICKET CP-8940 CREATED",
      );
    }, 1100);
  };

  const filteredComplaints = recentComplaints.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "ALL" ||
      item.category.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesSeverity =
      selectedSeverity === "ALL" || item.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const stats = statsData?.stats;

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full pt-14 bg-surface min-h-[calc(100vh-3.5rem)] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex flex-col w-full">
            {/* Greeting & Municipal Telemetry Summary Bar */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-gutter mb-space-xl">
              <div>
                <div className="inline-flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container-high mb-space-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Live Dispatch Stream
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                  Good morning, {user?.fullName || "Marcus"}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Ward 4 • Central District —{" "}
                  <span className="font-medium text-on-surface">
                    3 active local resolutions
                  </span>{" "}
                  in progress
                </p>
              </div>

              {/* Micro KPIs Pill Cluster */}
              <div className="flex flex-wrap items-center gap-space-sm bg-surface-container-lowest p-1.5 rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-surface-container-low">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    SLA Adherence
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary tabular-nums font-bold">
                    98.4%
                  </span>
                </div>
                <div className="flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-surface-container-low">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Avg Fix Latency
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary tabular-nums font-bold">
                    24.2h
                  </span>
                </div>
                <div className="flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-surface-container-low">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Active Crews
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
                    <span className="font-headline-sm text-headline-sm text-primary tabular-nums font-bold">
                      18
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Hero Intent & Natural Language Intake Bar */}
            <section className="mb-space-xl">
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-border p-2 md:p-3 transition-all hover:shadow-md">
                <form
                  className="flex flex-col sm:flex-row items-center gap-space-sm"
                  onSubmit={handleAnalyzeHazard}
                >
                  <div className="flex items-center flex-1 w-full px-space-md py-2 text-on-surface-variant">
                    <span
                      className="material-symbols-outlined text-secondary text-[22px] mr-space-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                    <input
                      className="w-full bg-transparent border-0 p-0 text-on-surface placeholder:text-outline font-body-lg text-body-lg focus:outline-none"
                      value={intentInput}
                      onChange={(e) => setIntentInput(e.target.value)}
                      placeholder="Describe a city hazard or drop an address (e.g. Deep pothole on Elm & 4th Ave)..."
                      type="text"
                    />
                  </div>
                  <div className="flex items-center gap-space-xs w-full sm:w-auto justify-end">
                    <button
                      className="p-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
                      title="Use current geolocation"
                      type="button"
                      onClick={() =>
                        setIntentInput(
                          "Deep pothole at Main St & 5th Ave (GPS Detected)",
                        )
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        near_me
                      </span>
                    </button>
                    <Link
                      href={
                        intentInput
                          ? `/report?description=${encodeURIComponent(intentInput)}`
                          : "/report"
                      }
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-space-lg py-2.5 bg-primary hover:bg-inverse-surface text-on-primary font-label-md text-label-md rounded-xl transition-all shadow-sm active:scale-[0.98]"
                    >
                      <span>Analyze with AI</span>
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </form>

                {analyzedResult && (
                  <div className="mt-space-sm p-space-md rounded-xl bg-secondary-fixed text-on-secondary-fixed font-body-sm text-body-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      check_circle
                    </span>
                    <span>{analyzedResult}</span>
                  </div>
                )}

                {/* Subchips / Quick Intent Tag Presets */}
                <div className="flex flex-wrap items-center gap-space-xs pt-3 mt-2 px-space-sm border-t border-surface-container-low">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mr-1">
                    Frequent:
                  </span>
                  {[
                    {
                      label: "Water Leak",
                      icon: "water_drop",
                      text: "High-pressure water main fissure on corner",
                    },
                    {
                      label: "Pothole",
                      icon: "traffic",
                      text: "Deep street pothole impacting lane traffic",
                    },
                    {
                      label: "Signal Outage",
                      icon: "cloud_upload",
                      text: "Flashing un-synced pedestrian signal",
                    },
                    {
                      label: "Illegal Dumping",
                      icon: "delete",
                      text: "Bulky illegal waste dumping in public alleyway",
                    },
                    {
                      label: "Tree Hazard",
                      icon: "nature",
                      text: "Splintered heavy oak branch leaning over roadway",
                    },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setIntentInput(preset.text)}
                      className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px] text-secondary">
                        {preset.icon}
                      </span>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Bento Grid Layout: Rapid Hazard Intake & District Performance Telemetry */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-space-xl">
              {/* Left Bento Card: Instant Intake Target with Computer Vision Analysis */}
              <div className="lg:col-span-6 bg-surface-container-lowest rounded-2xl border border-border p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div>
                  <div className="flex items-center justify-between mb-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">
                          photo_camera
                        </span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                          Instant Visual Intake
                        </h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Autonomous telemetry & computer vision triage
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                      CV Engine v4.2
                    </span>
                  </div>

                  {/* Interactive Drag Target Area */}
                  <div
                    className="cursor-pointer my-space-md p-space-xl rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col items-center justify-center text-center relative overflow-hidden"
                    onClick={triggerUploadSimulation}
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-space-sm text-secondary transition-transform group-hover:scale-105">
                      <span className="material-symbols-outlined text-[24px]">
                        cloud_upload
                      </span>
                    </div>
                    <p className="font-headline-sm text-headline-sm text-primary mb-1">
                      Drop hazard capture or browse file
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-space-md">
                      Directly extracts GPS coordinates, measures surface
                      displacement, and blinds private PII before municipal
                      dispatch.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-space-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container-lowest text-on-surface-variant font-code text-code shadow-sm">
                        <span className="material-symbols-outlined text-[12px] text-on-tertiary-container">
                          check_circle
                        </span>{" "}
                        EXIF Geo-locked
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container-lowest text-on-surface-variant font-code text-code shadow-sm">
                        <span className="material-symbols-outlined text-[12px] text-on-tertiary-container">
                          check_circle
                        </span>{" "}
                        Automated Plate/Face Blur
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container-lowest text-on-surface-variant font-code text-code shadow-sm">
                        <span className="material-symbols-outlined text-[12px] text-on-tertiary-container">
                          check_circle
                        </span>{" "}
                        &lt;400ms Ingestion
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Pipeline Micro Tracker */}
                <div className="pt-space-md flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  {cvAnalyzing ? (
                    <span className="flex items-center gap-2 text-secondary font-medium">
                      <span className="w-3 h-3 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
                      Running Computer Vision Hazard Detection...
                    </span>
                  ) : cvStatus ? (
                    <span className="flex items-center gap-1.5 text-on-tertiary-container font-medium">
                      <span className="material-symbols-outlined text-[16px]">
                        check_circle
                      </span>
                      {cvStatus}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      Ready for capture ingestion
                    </span>
                  )}
                  <span className="font-code text-code text-outline">
                    Supported: RAW, JPG, HEIC, MP4
                  </span>
                </div>
              </div>

              {/* Right Bento Card: District Performance Telemetry */}
              <div className="lg:col-span-6 bg-surface-container-lowest rounded-2xl border border-border p-space-lg shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">
                          query_stats
                        </span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                          District Telemetry
                        </h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Real-time public works responsiveness & SLA logs
                        </p>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Ward 4 • Last 24 Hours
                    </span>
                  </div>

                  {/* 2 Highlight Data Panels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md my-space-md">
                    {/* Metric 1: SLA Adherence with SVG Sparkline */}
                    <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                            24h SLA Adherence
                          </span>
                          <div className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1 tabular-nums">
                            96.8%
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                          +1.8%
                        </span>
                      </div>
                      {/* Hairline Sparkline */}
                      <div className="mt-4 h-10 w-full overflow-hidden">
                        <svg
                          className="w-full h-full text-secondary stroke-current fill-none"
                          viewBox="0 0 160 40"
                        >
                          <path
                            d="M 0 32 Q 25 28, 45 20 T 90 22 T 130 8 T 160 4"
                            strokeLinecap="round"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          ></path>
                          <path
                            className="fill-secondary/10 stroke-none"
                            d="M 0 32 Q 25 28, 45 20 T 90 22 T 130 8 T 160 4 L 160 40 L 0 40 Z"
                          ></path>
                        </svg>
                      </div>
                    </div>

                    {/* Metric 2: Dispatch Latency */}
                    <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                            Dispatch Latency
                          </span>
                          <div className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1 tabular-nums">
                            12.4
                            <span className="font-body-md text-body-md text-on-surface-variant ml-1 font-normal">
                              min
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary font-label-sm text-label-sm font-semibold">
                          -4.2m target
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between font-code text-code text-outline mb-1.5">
                          <span>Avg Response</span>
                          <span>Target: 16.0 min</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full"
                            style={{ width: "77%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3-Column Mini Status Footnotes */}
                <div className="grid grid-cols-3 gap-space-sm pt-space-md bg-surface-container-low/50 rounded-xl p-3 border border-surface-container-high">
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-primary tabular-nums">
                      42
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Active Mobile Crews
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-primary tabular-nums">
                      188
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Resolved this Week
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-primary flex items-center gap-1 tabular-nums">
                      4.9{" "}
                      <span
                        className="material-symbols-outlined text-secondary text-[16px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Community Rating
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Tracked Hazards & Open Cases Table/Card Hybrid */}
            <section className="mb-space-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
                    Your Active Submissions
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Municipal tracking numbers, crew status, and estimated
                    intervention times
                  </p>
                </div>
                <Link
                  className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:underline transition-colors group"
                  href="/citizen/dashboard"
                >
                  <span>View Complete History</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-surface-container-high">
                {/* Active Item 1 */}
                <div className="p-space-lg hover:bg-surface-container-low/40 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                    <div className="flex items-start gap-space-md">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-primary mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">
                          construction
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-code text-code font-semibold text-secondary">
                            #CP-8921
                          </span>
                          <span className="w-1 h-1 rounded-full bg-outline"></span>
                          <h3 className="font-headline-sm text-headline-sm text-primary">
                            Deep Pothole at Main & 5th Ave
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-outline">
                              location_on
                            </span>{" "}
                            Ward 4 • Crosswalk corridor
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-outline">
                              group
                            </span>{" "}
                            Assigned: Unit #4 Rapid Pavement
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-space-lg">
                      <div className="flex flex-col md:items-end">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                          <span className="font-label-sm text-label-sm text-primary font-medium">
                            Crew On-Site
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                          ETA to Completion: 45 min
                        </span>
                      </div>
                      <Link
                        href="/citizen/dashboard"
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          chevron_right
                        </span>
                      </Link>
                    </div>
                  </div>
                  {/* Inline Step Progression Meter */}
                  <div className="mt-space-md pt-space-sm border-t border-surface-container-low">
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                      <span className="text-primary font-medium">
                        1. Triaged (AI CV)
                      </span>
                      <span className="text-primary font-medium">
                        2. Crew Dispatched
                      </span>
                      <span className="text-primary font-medium">
                        3. Asphalt Infill In Progress
                      </span>
                      <span className="text-outline">
                        4. Public Verification
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: "72%" }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Active Item 2 */}
                <div className="p-space-lg hover:bg-surface-container-low/40 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                    <div className="flex items-start gap-space-md">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-primary mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">
                          traffic
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-code text-code font-semibold text-secondary">
                            #CP-8754
                          </span>
                          <span className="w-1 h-1 rounded-full bg-outline"></span>
                          <h3 className="font-headline-sm text-headline-sm text-primary">
                            Pedestrian Signal Sync Failure
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-outline">
                              location_on
                            </span>{" "}
                            Ward 4 • 8th St Transit Stop
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-outline">
                              engineering
                            </span>{" "}
                            Assigned: Metro Traffic Electrical
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-space-lg">
                      <div className="flex flex-col md:items-end">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container">
                          <span className="w-2 h-2 rounded-full bg-outline"></span>
                          <span className="font-label-sm text-label-sm text-on-surface font-medium">
                            Scheduled Today
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                          Scheduled Window: 3:00 PM
                        </span>
                      </div>
                      <Link
                        href="/citizen/dashboard"
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          chevron_right
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Community Audit Stream: Verified Municipal Proof of Work */}
            <section className="mb-space-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
                      Community Audit Stream
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-tertiary-container font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">
                        verified
                      </span>{" "}
                      Proof of Work
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Neighbor-verified fixes with timestamped before and after
                    visual records
                  </p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm">
                    Most Recent
                  </button>
                  <button className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm">
                    Near Ward 4
                  </button>
                </div>
              </div>

              {/* 2-Column Showcase Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Showcase Card 1 */}
                <div className="bg-surface-container-lowest rounded-2xl border border-border p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <span className="font-code text-code text-on-surface-variant">
                        Ticket #CP-8610 • Fixed 2h ago
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[14px] text-secondary">
                          bolt
                        </span>{" "}
                        Turnaround: 3h 12m
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
                      Water Main Pipe Joint Repair
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-outline">
                        location_on
                      </span>{" "}
                      8th & Oak Blvd • Cross-street hydrant lead
                    </p>

                    {/* Before / After Photo Comparison Grid */}
                    <div className="grid grid-cols-2 gap-space-sm mb-space-md">
                      <div className="flex flex-col gap-1">
                        <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-surface-container-high">
                          <img
                            className="w-full h-full object-cover"
                            alt="Water leak before repair"
                            src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/80 backdrop-blur text-on-primary font-label-sm text-label-sm">
                            Before
                          </span>
                        </div>
                        <span className="font-code text-code text-outline">
                          Reported 07:15 AM
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-surface-container-high">
                          <img
                            className="w-full h-full object-cover"
                            alt="Repaved clean asphalt after repair"
                            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/80 backdrop-blur text-on-primary font-label-sm text-label-sm">
                            Resolved
                          </span>
                        </div>
                        <span className="font-code text-code text-on-tertiary-container font-medium">
                          Signed off 10:27 AM
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Social Proof / Community Endorsement */}
                  <div className="pt-space-md border-t border-surface-container-low flex items-center justify-between">
                    <button
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-colors ${
                        endorsedByUser["CP-8610"]
                          ? "bg-secondary-fixed text-on-secondary-fixed"
                          : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                      }`}
                      onClick={() => toggleEndorse("CP-8610")}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        thumb_up
                      </span>
                      <span>{endorsements["CP-8610"] || 54} confirmations</span>
                    </button>
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">
                        verified
                      </span>{" "}
                      Verified by District Inspector
                    </span>
                  </div>
                </div>

                {/* Showcase Card 2 */}
                <div className="bg-surface-container-lowest rounded-2xl border border-border p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <span className="font-code text-code text-on-surface-variant">
                        Ticket #CP-8594 • Fixed Yesterday
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[14px] text-secondary">
                          bolt
                        </span>{" "}
                        Turnaround: 5.5h
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
                      High-Mast LED Streetlight Replacement
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-outline">
                        location_on
                      </span>{" "}
                      Pine St & 12th Avenue Pedestrian Corridor
                    </p>

                    {/* Verified Single Wide Asset */}
                    <div className="relative rounded-xl overflow-hidden aspect-[8/3] bg-surface-container-high mb-space-md">
                      <img
                        className="w-full h-full object-cover"
                        alt="Illuminated street lamp fixture"
                        src="https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-space-md">
                        <div className="flex items-center justify-between w-full text-on-primary">
                          <span className="font-label-md text-label-md">
                            New Luminaire #L-409 Activated
                          </span>
                          <span className="font-code text-code bg-surface-container-lowest/20 backdrop-blur px-2 py-0.5 rounded text-on-primary">
                            100% Lumens
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-space-md border-t border-surface-container-low flex items-center justify-between">
                    <button
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-colors ${
                        endorsedByUser["CP-8594"]
                          ? "bg-secondary-fixed text-on-secondary-fixed"
                          : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                      }`}
                      onClick={() => toggleEndorse("CP-8594")}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        thumb_up
                      </span>
                      <span>{endorsements["CP-8594"] || 38} confirmations</span>
                    </button>
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">
                        verified
                      </span>{" "}
                      Verified by Metro Utilities
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Live Municipal Map & Directory Grid */}
            <section className="space-y-6 mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-headline-md text-headline-md text-[#18181b] tracking-tight flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#0051d5]" />
                    Live Municipal Geographic Map
                  </h2>
                  <p className="font-body-sm text-body-sm text-[#47464b]">
                    Spatial distribution of active complaints and crew
                    dispatches
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-[#47464b]">
                    Category:
                  </span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#ffffff] border border-[#e4e4e7] rounded-xl px-3 py-1.5 font-label-md text-label-md focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  >
                    <option value="ALL">All Sectors</option>
                    <option value="Roads">Roads & Infrastructure</option>
                    <option value="Water">Water & Sanitation</option>
                    <option value="Electricity">Lighting & Power</option>
                    <option value="Waste">Sanitation & Waste</option>
                  </select>
                </div>
              </div>

              <MapboxMap
                interactive={true}
                zoom={11}
                markers={filteredComplaints.map((c) => ({
                  id: c.id,
                  latitude: c.latitude || 40.7128,
                  longitude: c.longitude || -74.006,
                  title: c.title,
                  category: c.category,
                  severity: c.severity,
                  status: c.status,
                }))}
                className="h-[400px] w-full rounded-2xl overflow-hidden border border-[#e4e4e7] shadow-sm"
              />

              {/* Public Complaint Directory & Search Bar */}
              <div className="space-y-4 pt-4 border-t border-[#e8e7f1]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-[#18181b]">
                      Public Incident Ledger & Open Data Exports
                    </h3>
                    <p className="font-body-sm text-body-sm text-[#47464b]">
                      Open311 compliant live municipal database
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href="/api/public/export/csv"
                      download="civicpulse-open-data.csv"
                      className="px-3 py-1.5 rounded-xl border border-[#e4e4e7] bg-[#ffffff] hover:bg-[#f4f2fd] text-[#18181b] font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-[#0051d5]" />
                      <span>Export CSV</span>
                    </a>

                    <a
                      href="/api/public/export/json"
                      download="civicpulse-open-data.json"
                      className="px-3 py-1.5 rounded-xl border border-[#e4e4e7] bg-[#ffffff] hover:bg-[#f4f2fd] text-[#18181b] font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-[#009668]" />
                      <span>Open311 (JSON)</span>
                    </a>

                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-[#77767b] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ticket title or address..."
                        className="w-full bg-[#ffffff] border border-[#e4e4e7] rounded-xl pl-9 pr-3 py-1.5 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                      />
                    </div>
                  </div>
                </div>

                {!filteredComplaints.length ? (
                  <div className="py-12 text-center text-body-sm text-[#77767b] bg-[#ffffff] rounded-2xl border border-[#e4e4e7]">
                    No public complaints match your filter criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredComplaints.map((item) => {
                      const count = endorsements[item.id] || 0;
                      const hasEndorsed = !!endorsedByUser[item.id];

                      return (
                        <div
                          key={item.id}
                          className="p-5 rounded-2xl bg-[#ffffff] border border-[#e4e4e7] shadow-sm hover:border-[#0051d5]/40 transition-all space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <h3 className="font-headline-sm text-headline-sm text-[#18181b]">
                                  {item.title}
                                </h3>
                                <p className="font-body-sm text-body-sm text-[#47464b]">
                                  Category:{" "}
                                  <span className="font-medium text-[#18181b]">
                                    {item.category}
                                  </span>
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <SeverityBadge severity={item.severity} />
                                <StatusBadge status={item.status} />
                              </div>
                            </div>

                            <p className="font-body-sm text-body-sm text-[#47464b] line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-[#f4f2fd] flex items-center justify-between gap-2 text-xs">
                            {item.locationName && (
                              <div className="flex items-center gap-1 text-[#77767b] font-body-sm text-body-sm truncate">
                                <MapPin className="w-3.5 h-3.5 text-[#0051d5] shrink-0" />
                                <span className="truncate">
                                  {item.locationName}
                                </span>
                              </div>
                            )}

                            <button
                              onClick={() => toggleEndorse(item.id)}
                              className={`px-3 py-1.5 rounded-xl font-label-md text-label-md border transition-all flex items-center gap-1.5 shrink-0 ${
                                hasEndorsed
                                  ? "bg-[#0051d5] text-white border-[#0051d5] shadow-sm"
                                  : "bg-[#f4f2fd] text-[#47464b] border-[#e4e4e7] hover:text-[#18181b]"
                              }`}
                            >
                              <ThumbsUp
                                className={`w-3.5 h-3.5 ${hasEndorsed ? "fill-current" : ""}`}
                              />
                              <span>
                                {hasEndorsed ? "Endorsed" : "Endorse (+1)"}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-md bg-[#ffffff]/30 font-code text-code font-bold">
                                {count}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Department & Category Distribution Charts */}
            {statsData && (
              <AnalyticsCharts
                byCategory={statsData.byCategory}
                byDepartment={statsData.byDepartment}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#ffffff] border-t border-[#e8e7f1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#47464b] font-label-sm text-label-sm">
          <div>
            © 2026 CivicPulse Municipal Intelligence Platform. All rights
            reserved.
          </div>
          <div className="flex items-center gap-6">
            <a className="hover:text-[#1a1b22] transition-colors" href="#">
              Data Privacy
            </a>
            <a className="hover:text-[#1a1b22] transition-colors" href="#">
              Security Policy
            </a>
            <a className="hover:text-[#1a1b22] transition-colors" href="#">
              Open API Reference
            </a>
          </div>
        </div>
      </footer>

      <RagAssistantModal
        isOpen={isRagOpen}
        onClose={() => setIsRagOpen(false)}
      />
    </div>
  );
}
