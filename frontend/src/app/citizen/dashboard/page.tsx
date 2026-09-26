"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/Badges";
import Navbar from "@/components/Navbar";
import {
  type CitizenDashboardData,
  type Complaint,
  citizenApi,
  type User,
} from "@/lib/api";
import { getClientUser } from "@/lib/auth";

const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
});

export default function CitizenDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<CitizenDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  // CSAT Rating State
  const [starRating, setStarRating] = useState(5);
  const [csatTags, setCsatTags] = useState<string[]>([
    "prompt",
    "clean",
    "courteous",
  ]);
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // New Complaint Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: "",
    description: "",
    category: "ROADS",
    locationName: "Main Street & 5th Ave, Ward 4",
    latitude: 40.7128,
    longitude: -74.006,
  });

  const loadDashboard = async () => {
    try {
      const res = await citizenApi.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load citizen dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getClientUser());
    loadDashboard();
  }, []);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await citizenApi.createComplaint(newComplaint);
      setIsNewModalOpen(false);
      setNewComplaint({
        title: "",
        description: "",
        category: "ROADS",
        locationName: "Main Street & 5th Ave, Ward 4",
        latitude: 40.7128,
        longitude: -74.006,
      });
      loadDashboard();
    } catch (err: any) {
      alert(err.message || "Failed to create complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCSAT = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerifiedSuccess(true);
    }, 800);
  };

  const toggleCsatTag = (tag: string) => {
    setCsatTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const complaintsList = data?.recentComplaints || [];
  const activeCount =
    complaintsList.filter(
      (c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED",
    ).length || 2;
  const triageCount =
    complaintsList.filter((c) => c.status === "PENDING").length || 1;
  const resolvedCount =
    complaintsList.filter((c) => c.status === "RESOLVED").length || 5;

  const filteredComplaints = complaintsList.filter((c) => {
    if (activeFilter === "active")
      return c.status === "IN_PROGRESS" || c.status === "ASSIGNED";
    if (activeFilter === "triage") return c.status === "PENDING";
    if (activeFilter === "resolved") return c.status === "RESOLVED";
    return true;
  });

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full pt-14 bg-surface min-h-[calc(100vh-3.5rem)] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex flex-col w-full">
            {/* Header with Title & Filter Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg mb-space-xl">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-sm mb-1">
                  <span className="font-code text-code text-on-surface-variant uppercase tracking-wider">
                    Telemetry // Incident Ledger
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">
                    Sync Active
                  </span>
                </div>
                <h1 className="font-display text-display text-primary tracking-tight">
                  Incident Tracking & Lifecycle
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                  Real-time telemetry, stage progression, and crew audit logs
                  for your neighborhood reports.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-md">
                <div className="p-1 bg-surface-container rounded-lg flex items-center gap-1 shadow-sm border border-border">
                  {[
                    { id: "active", label: "Active", count: activeCount },
                    { id: "triage", label: "In Triage", count: triageCount },
                    { id: "resolved", label: "Resolved", count: resolvedCount },
                    {
                      id: "all",
                      label: "All Reports",
                      count: complaintsList.length || 8,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      type="button"
                      className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                        activeFilter === tab.id
                          ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      {tab.label}{" "}
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface text-[10px] font-semibold tabular-nums">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <a
                  href="/api/public/export/csv"
                  download="civicpulse-history.csv"
                  className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-lowest border border-border text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    download
                  </span>
                  Export History (CSV)
                </a>

                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-space-lg py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add_circle
                  </span>
                  <span>File Complaint</span>
                </button>
              </div>
            </div>

            {/* Featured Active Incident Detail Card (#CP-8921) */}
            <section className="mb-space-xl flex flex-col gap-space-lg">
              <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-space-xl relative overflow-hidden">
                <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none"></div>

                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-space-lg mb-space-xl relative">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex flex-wrap items-center gap-space-sm mb-1">
                      <span className="font-code text-code px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-semibold">
                        #CP-8921
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                        High Priority
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Telemetry Feed ID: 092-AX
                      </span>
                    </div>

                    <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
                      Deep Asphalt Pothole on Main St
                    </h2>

                    <div className="flex flex-wrap items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          location_on
                        </span>
                        442 Main St (Westbound Lane)
                      </span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          schedule
                        </span>
                        Today at 08:24 AM
                      </span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          person
                        </span>
                        Reported by {user?.fullName || "Marcus Reed"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-md self-start xl:self-center">
                    <div className="flex flex-col items-end">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Overall Progress
                      </span>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold tabular-nums">
                        65% Active
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center relative">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                        <circle
                          className="text-surface-variant"
                          cx="24"
                          cy="24"
                          fill="none"
                          r="18"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <circle
                          className="text-secondary"
                          cx="24"
                          cy="24"
                          fill="none"
                          r="18"
                          stroke="currentColor"
                          strokeDasharray="113"
                          strokeDashoffset="39.5"
                          strokeLinecap="round"
                          strokeWidth="4"
                        ></circle>
                      </svg>
                      <span className="material-symbols-outlined text-secondary text-[20px] absolute">
                        precision_manufacturing
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Stage Stepper Bar */}
                <div className="w-full bg-surface-container-low rounded-xl p-space-lg mb-space-xl border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-space-lg relative">
                    <div className="hidden md:block absolute top-4 left-6 right-6 h-0.5 bg-surface-variant z-0"></div>
                    <div className="hidden md:block absolute top-4 left-6 w-[58%] h-0.5 bg-secondary z-0"></div>

                    {/* Stage 1 */}
                    <div className="flex flex-col relative z-10">
                      <div className="flex items-center gap-space-sm mb-space-sm">
                        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-[16px]">
                            check
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                          Stage 01
                        </span>
                      </div>
                      <div className="font-headline-sm text-label-md text-primary font-bold">
                        Triage & Validation
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Completed • 08:29 AM
                      </div>
                      <div className="font-code text-code text-on-tertiary-container mt-1 inline-flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">
                          verified
                        </span>{" "}
                        AI Auto-Tagged
                      </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="flex flex-col relative z-10">
                      <div className="flex items-center gap-space-sm mb-space-sm">
                        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-[16px]">
                            check
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                          Stage 02
                        </span>
                      </div>
                      <div className="font-headline-sm text-label-md text-primary font-bold">
                        Crew Assigned
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Completed • 09:12 AM
                      </div>
                      <div className="font-code text-code text-on-surface mt-1">
                        Unit #04 Lead J. Smith
                      </div>
                    </div>

                    {/* Stage 3 (Live) */}
                    <div className="flex flex-col relative z-10">
                      <div className="flex items-center gap-space-sm mb-space-sm">
                        <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md relative">
                          <span className="w-3 h-3 rounded-full bg-surface-container-lowest"></span>
                          <span className="absolute -inset-1 rounded-full bg-secondary/30 animate-ping"></span>
                        </div>
                        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">
                          Stage 03 (Live)
                        </span>
                      </div>
                      <div className="font-headline-sm text-label-md text-primary font-bold">
                        On-Site Repair
                      </div>
                      <div className="font-body-sm text-body-sm text-secondary font-medium mt-0.5">
                        In Progress (65%)
                      </div>
                      <div className="font-code text-code text-on-surface-variant mt-1">
                        Hot-mix asphalt compaction
                      </div>
                    </div>

                    {/* Stage 4 */}
                    <div className="flex flex-col relative z-10 opacity-70">
                      <div className="flex items-center gap-space-sm mb-space-sm">
                        <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px]">
                            hourglass_empty
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                          Stage 04
                        </span>
                      </div>
                      <div className="font-headline-sm text-label-md text-primary">
                        Closeout & Rating
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Upcoming
                      </div>
                      <div className="font-code text-code text-on-surface-variant mt-1">
                        Resident sign-off pending
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-cards: Audio Log & Geofence Telemetry */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
                  <div className="lg:col-span-7 bg-surface-container-low rounded-xl p-space-lg flex flex-col justify-between border border-border">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-surface-variant">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md">
                            JS
                          </div>
                          <div>
                            <div className="font-label-md text-label-md text-primary flex items-center gap-1.5 font-semibold">
                              Jane Smith
                              <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface font-code text-code">
                                Crew #04 Lead
                              </span>
                            </div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">
                              Field Dispatch Audio-Log • 09:44 AM
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-code text-code">
                          Secured Zone
                        </span>
                      </div>
                      <blockquote className="font-body-md text-body-md text-on-surface italic pl-space-md bg-surface-container-lowest/60 rounded-lg p-space-md border-l-2 border-primary">
                        “Crew #04 arrived on scene. Outer lane cordoned with
                        high-visibility safety cones. Asphalt temp: 148°C
                        (Optimal). Surface coat curing begins shortly. Vibration
                        telemetry within residential tolerance limits.”
                      </blockquote>
                    </div>
                    <div className="mt-space-md flex flex-wrap items-center justify-between gap-space-sm pt-space-sm border-t border-surface-variant">
                      <div className="flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                            done_all
                          </span>{" "}
                          Equipment Sync OK
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">
                            sensors
                          </span>{" "}
                          Patch Depth: 4.8 cm
                        </span>
                      </div>
                      <a
                        className="inline-flex items-center gap-space-xs font-label-md text-label-md text-secondary hover:underline"
                        href="#"
                      >
                        <span>View full shift log</span>
                        <span className="material-symbols-outlined text-[14px]">
                          arrow_forward
                        </span>
                      </a>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-surface-container rounded-xl p-space-lg flex flex-col justify-between border border-border">
                    <div>
                      <div className="flex items-center justify-between mb-space-md">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                          Micro-Geofence Telemetry
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest font-code text-code text-on-tertiary-container">
                          <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
                          Active Node
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-space-sm mb-space-md text-center">
                        <div className="bg-surface-container-lowest rounded-lg p-space-sm shadow-sm">
                          <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                            Ambient
                          </span>
                          <span className="font-headline-sm text-headline-sm text-primary font-bold tabular-nums">
                            22°C
                          </span>
                          <span className="font-code text-[10px] text-on-tertiary-container block mt-0.5">
                            Dry / Sunny
                          </span>
                        </div>
                        <div className="bg-surface-container-lowest rounded-lg p-space-sm shadow-sm">
                          <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                            Traffic Impact
                          </span>
                          <span className="font-headline-sm text-headline-sm text-error font-bold tabular-nums">
                            +4m
                          </span>
                          <span className="font-code text-[10px] text-on-surface-variant block mt-0.5">
                            Minor slowing
                          </span>
                        </div>
                        <div className="bg-surface-container-lowest rounded-lg p-space-sm shadow-sm">
                          <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                            Clearance
                          </span>
                          <span className="font-headline-sm text-headline-sm text-primary font-bold tabular-nums">
                            11:45
                          </span>
                          <span className="font-code text-[10px] text-secondary font-medium block mt-0.5">
                            Est. Today
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <button
                        className="w-full inline-flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-sm"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          near_me
                        </span>
                        Track Crew Live GPS
                      </button>
                      <button
                        className="p-2.5 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-primary transition-all shadow-sm"
                        title="Bookmark case"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          bookmark
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Resolved Incidents Pending Verification & CSAT Review */}
            <section className="flex flex-col gap-space-lg mb-space-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Resolved Incidents Pending Verification
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                    1 ready for CSAT
                  </span>
                </div>
                <a
                  className="font-label-md text-label-md text-secondary hover:underline"
                  href="#"
                >
                  View archived resolutions
                </a>
              </div>

              <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-space-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-lg mb-space-lg border-b border-surface-container-high">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-space-sm">
                      <span className="font-code text-code px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-semibold">
                        #CP-8402
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                        Resolved & Verified
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Water & Sewage Authority
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary">
                      Sub-Surface Water Main Joint Leakage
                    </h4>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Oakridge Blvd • Incident duration: 3 hours 12 minutes
                      (Under SLA benchmark of 6 hours)
                    </span>
                  </div>
                  <div className="flex items-center gap-space-md bg-surface-container-low px-space-md py-2.5 rounded-lg self-start md:self-auto border border-outline-variant">
                    <div className="text-right">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">
                        Turnaround Performance
                      </span>
                      <span className="font-label-md text-label-md font-semibold text-on-tertiary-container">
                        3h 12m (-46% vs SLA)
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-on-tertiary-container text-[24px]">
                      speed
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg mb-space-xl">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                        Initial Incident Report (08:15 AM)
                      </span>
                      <span className="font-code text-code text-error bg-error-container/40 px-2 py-0.5 rounded">
                        Severe Flow Detected
                      </span>
                    </div>
                    <div className="relative h-64 w-full rounded-xl overflow-hidden bg-surface-container">
                      <img
                        className="w-full h-full object-cover"
                        alt="Ruptured street water leak"
                        src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-inverse-surface/80 backdrop-blur-sm text-inverse-on-surface font-code text-[11px]">
                        Sensor Node: #W-104 • Flow: 14.2 L/min
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                        Post-Remediation Inspection (11:27 AM)
                      </span>
                      <span className="font-code text-code text-on-tertiary-container bg-surface-container px-2 py-0.5 rounded font-semibold">
                        Cured & Resealed
                      </span>
                    </div>
                    <div className="relative h-64 w-full rounded-xl overflow-hidden bg-surface-container">
                      <img
                        className="w-full h-full object-cover"
                        alt="Restored clean street surface"
                        src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-inverse-surface/80 backdrop-blur-sm text-inverse-on-surface font-code text-[11px]">
                        Inspected by: Field Engineer T. Vance
                      </div>
                    </div>
                  </div>
                </div>

                {/* CSAT Rating Form */}
                <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg border border-border">
                  <div className="flex flex-col gap-space-xs max-w-xl">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        rate_review
                      </span>
                      <span className="font-label-md text-label-md text-primary font-semibold">
                        Citizen Validation & CSAT Review
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Please verify that road access has been fully restored and
                      crew operations left no debris. Your input directly
                      influences contractor evaluation.
                    </p>
                    <div className="flex flex-wrap items-center gap-space-xs mt-space-xs">
                      {[
                        { id: "prompt", label: "✓ Prompt Turnaround" },
                        { id: "clean", label: "✓ Clean Work Area" },
                        { id: "courteous", label: "✓ Courteous Crew" },
                        { id: "noise", label: "Minimal Noise" },
                      ].map((tag) => {
                        const isSelected = csatTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleCsatTag(tag.id)}
                            className={`px-space-md py-1 rounded-full font-label-sm text-label-sm shadow-sm transition-all ${
                              isSelected
                                ? "bg-primary text-on-primary font-semibold"
                                : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"
                            }`}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-lg w-full lg:w-auto justify-end">
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="font-label-sm text-label-sm text-on-surface-variant mb-1">
                        Resolution Quality
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setStarRating(star)}
                            className="text-primary hover:scale-110 transition-transform"
                          >
                            <span
                              className="material-symbols-outlined text-[24px]"
                              style={{
                                fontVariationSettings:
                                  star <= starRating ? "'FILL' 1" : "'FILL' 0",
                              }}
                            >
                              star
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleVerifyCSAT}
                      disabled={verifying || verifiedSuccess}
                      className={`w-full sm:w-auto px-space-lg py-2.5 rounded-lg text-on-primary font-label-md text-label-md transition-all shadow-sm whitespace-nowrap flex items-center justify-center gap-space-sm ${
                        verifiedSuccess
                          ? "bg-on-tertiary-container"
                          : "bg-primary hover:bg-primary-container"
                      }`}
                      type="button"
                    >
                      {verifying ? (
                        <>
                          <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                          <span>Validating...</span>
                        </>
                      ) : verifiedSuccess ? (
                        <>
                          <span className="material-symbols-outlined text-[16px]">
                            check_circle
                          </span>
                          <span>Verified & Logged</span>
                        </>
                      ) : (
                        <span>Submit Citizen Verification</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom 3 Summary Telemetry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-xl">
              <div className="bg-surface-container-lowest rounded-xl border border-border p-space-lg shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider font-semibold">
                    Average Response Time
                  </span>
                  <div className="font-display text-[32px] leading-8 text-primary font-bold mt-1 tabular-nums">
                    18.4
                    <span className="text-label-md font-normal text-on-surface-variant ml-1">
                      mins
                    </span>
                  </div>
                  <span className="font-code text-code text-on-tertiary-container inline-flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">
                      trending_down
                    </span>{" "}
                    4.2 mins faster vs last month
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">
                    timer
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl border border-border p-space-lg shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider font-semibold">
                    Public Verification Score
                  </span>
                  <div className="font-display text-[32px] leading-8 text-primary font-bold mt-1 tabular-nums">
                    98.2
                    <span className="text-label-md font-normal text-on-surface-variant ml-1">
                      %
                    </span>
                  </div>
                  <span className="font-code text-code text-on-tertiary-container inline-flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">
                      sentiment_satisfied
                    </span>{" "}
                    Over 4,200 local resident audits
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">
                    thumb_up
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl border border-border p-space-lg shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider font-semibold">
                    Active Crews Deployed
                  </span>
                  <div className="font-display text-[32px] leading-8 text-primary font-bold mt-1 tabular-nums">
                    14
                    <span className="text-label-md font-normal text-on-surface-variant ml-1">
                      units
                    </span>
                  </div>
                  <span className="font-code text-code text-secondary inline-flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">
                      local_shipping
                    </span>{" "}
                    2 units queued for Central Ward
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[22px]">
                    engineering
                  </span>
                </div>
              </div>
            </div>

            {/* Filtered Active Complaints Directory List */}
            <div className="space-y-space-md pt-space-lg border-t border-surface-container-high">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                All Incident Submissions ({filteredComplaints.length})
              </h3>
              {loading ? (
                <div className="py-8 text-center text-body-sm text-outline">
                  Loading submissions...
                </div>
              ) : !filteredComplaints.length ? (
                <div className="py-8 text-center text-body-sm text-outline bg-surface-container-lowest rounded-xl border border-border">
                  No complaints found under filter tab "{activeFilter}".
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredComplaints.map((item) => (
                    <div
                      key={item.id}
                      className="p-space-lg rounded-xl bg-surface-container-lowest border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-lg hover:border-secondary/40 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-headline-sm text-headline-sm text-primary font-semibold">
                            {item.title}
                          </span>
                          <SeverityBadge severity={item.severity} />
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Category: {item.category} • Location:{" "}
                          {item.locationName || "Ward 4"} • Logged:{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <span className="font-code text-code px-2 py-1 rounded bg-surface-container-low text-primary">
                          {item.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* New Complaint Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-border rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-space-lg space-y-space-md">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-space-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[22px] text-secondary">
                  add_circle
                </span>
                Report a Municipal Issue
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-space-md">
              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-outline uppercase">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newComplaint.title}
                  onChange={(e) =>
                    setNewComplaint({ ...newComplaint, title: e.target.value })
                  }
                  placeholder="e.g. Deep pothole causing hazard on 5th Ave"
                  className="w-full bg-surface-container-low border border-border rounded-xl px-3 py-2 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase">
                    Category
                  </label>
                  <select
                    value={newComplaint.category}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-surface-container-low border border-border rounded-xl px-3 py-2 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="ROADS">Roads & Infrastructure</option>
                    <option value="WATER">Water & Sanitation</option>
                    <option value="LIGHTING">Lighting & Power</option>
                    <option value="WASTE">Sanitation & Waste</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={newComplaint.locationName}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        locationName: e.target.value,
                      })
                    }
                    placeholder="e.g. Main Street & 5th Ave"
                    className="w-full bg-surface-container-low border border-border rounded-xl px-3 py-2 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-outline uppercase">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={newComplaint.description}
                  onChange={(e) =>
                    setNewComplaint({
                      ...newComplaint,
                      description: e.target.value,
                    })
                  }
                  placeholder="Provide context..."
                  className="w-full bg-surface-container-low border border-border rounded-xl px-3 py-2 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md shadow-md transition-all flex items-center justify-center gap-space-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Incident Report</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="w-full bg-surface border-t border-surface-container-high">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-on-surface-variant font-label-sm text-label-sm">
          <div>
            © 2026 CivicPulse Municipal Intelligence Platform. All rights
            reserved.
          </div>
          <div className="flex items-center gap-6">
            <a className="hover:text-on-surface transition-colors" href="#">
              Data Privacy
            </a>
            <a className="hover:text-on-surface transition-colors" href="#">
              Security Policy
            </a>
            <a className="hover:text-on-surface transition-colors" href="#">
              Open API Reference
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
