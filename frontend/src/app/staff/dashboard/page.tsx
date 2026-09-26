"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  History,
  Loader2,
  MapPin,
  MessageSquareQuote,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Timer,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/Badges";
import Navbar from "@/components/Navbar";
import {
  type Complaint,
  type StaffDashboardData,
  staffApi,
  type User,
} from "@/lib/api";
import { getClientUser } from "@/lib/auth";

export default function StaffDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  // Update Status Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [newStatus, setNewStatus] = useState("IN_PROGRESS");
  const [note, setNote] = useState("");
  const [includeAiReply, setIncludeAiReply] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [aiSuggestedReply, setAiSuggestedReply] = useState<string | null>(null);

  // Staff Assignment Modal State
  const [assigningComplaint, setAssigningComplaint] =
    useState<Complaint | null>(null);
  const [assignedStaffEmail, setAssignedStaffEmail] =
    useState("tech@roads.gov");
  const [assigning, setAssigning] = useState(false);

  // Audit History Modal State
  const [auditComplaint, setAuditComplaint] = useState<Complaint | null>(null);

  const loadStaffDashboard = async () => {
    try {
      const res = await staffApi.getDashboard();
      setData(res.data);
      const listRes = await staffApi.getAllComplaints({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      });
      setAllComplaints(listRes.data?.content || []);
    } catch (err) {
      console.error("Failed to load staff console", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getClientUser());
    loadStaffDashboard();
  }, [statusFilter, severityFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);
    setAiSuggestedReply(null);

    try {
      const res = await staffApi.updateStatus(selectedComplaint.id, {
        status: newStatus,
        note,
        includeAiReply,
      });
      if (res.data?.suggestedReply) {
        setAiSuggestedReply(res.data.suggestedReply);
      } else {
        setSelectedComplaint(null);
        setNote("");
      }

      loadStaffDashboard();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint) return;
    setAssigning(true);

    try {
      await staffApi.assign(assigningComplaint.id, assignedStaffEmail);
      setAssigningComplaint(null);
      loadStaffDashboard();
    } catch (err: any) {
      alert(err.message || "Failed to assign staff member");
    } finally {
      setAssigning(false);
    }
  };

  const filteredComplaints = allComplaints.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.locationName?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.citizen?.fullName?.toLowerCase().includes(q)
    );
  });

  const getSlaBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return {
          text: "Emergency SLA: 4h",
          cls: "text-red-600 bg-red-500/10 border-red-500/30",
        };
      case "HIGH":
        return {
          text: "Priority SLA: 12h",
          cls: "text-amber-600 bg-amber-500/10 border-amber-500/30",
        };
      case "MEDIUM":
        return {
          text: "Standard SLA: 24h",
          cls: "text-blue-600 bg-blue-500/10 border-blue-500/30",
        };
      default:
        return {
          text: "Standard SLA: 48h",
          cls: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
        };
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full pt-14 bg-surface min-h-[calc(100vh-3.5rem)] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex flex-col w-full">
            {/* System Diagnostic Subhead & Status Strip */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-lg mb-space-sm border-b border-surface-container-high">
              <div className="flex items-center gap-space-sm flex-wrap">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-code text-code">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-ping"></span>
                  <span>Spring Gateway v2.4.19-PROD</span>
                </div>
                <span className="text-outline-variant font-code text-code">
                  •
                </span>
                <span className="font-code text-code text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-secondary">
                    database
                  </span>{" "}
                  Neon DB Connected
                </span>
                <span className="text-outline-variant font-code text-code">
                  •
                </span>
                <span className="font-code text-code text-on-surface-variant">
                  Zone 2 Central Dispatch (Node ID: #US-E-44)
                </span>
              </div>

              {/* Zone Pill Filters */}
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1 md:pb-0">
                <div className="flex items-center bg-surface-container rounded-lg p-0.5 border border-border">
                  <button
                    className="px-space-md py-1 rounded font-label-sm text-label-sm bg-surface-container-lowest text-primary shadow-sm"
                    type="button"
                  >
                    Zone 2 (Downtown Core)
                  </button>
                  <button
                    className="px-space-md py-1 rounded font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
                    type="button"
                  >
                    Zone 1 (North)
                  </button>
                  <button
                    className="px-space-md py-1 rounded font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
                    type="button"
                  >
                    Zone 3 (Harbor Basin)
                  </button>
                </div>
                <button
                  className="flex items-center gap-1 px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors border border-border"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    file_download
                  </span>
                  <span>Export Manifest</span>
                </button>
              </div>
            </div>

            {/* Live Metrics Bar (4 Precision Sleek Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter my-space-xl">
              {/* Card 1: Active Queue */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider">
                    Active Queue
                  </span>
                  <span className="material-symbols-outlined text-[18px]">
                    inbox
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-space-sm">
                  <span className="font-headline-lg text-headline-lg text-primary tracking-tight tabular-nums">
                    {loading ? "..." : allComplaints.length}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    incidents pending
                  </span>
                </div>
                <div className="mt-space-md flex items-center justify-between">
                  <div className="w-full h-7">
                    <svg
                      className="w-full h-full text-secondary"
                      fill="none"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 26"
                    >
                      <path
                        d="M0 20 L15 17 L30 22 L45 11 L60 16 L75 8 L90 12 L100 4"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                      <path
                        d="M0 20 L15 17 L30 22 L45 11 L60 16 L75 8 L90 12 L100 4 V 26 H 0 Z"
                        fill="currentColor"
                        fillOpacity="0.08"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2: Critical Triage */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider">
                    Critical Triage
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-container text-on-error-container">
                    <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                    <span className="font-code text-code">P0 ALERT</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-space-sm">
                  <span className="font-headline-lg text-headline-lg text-error tracking-tight tabular-nums">
                    {loading ? "..." : data?.stats.highPriorityCount || 0}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    high-priority alerts
                  </span>
                </div>
                <div className="mt-space-md flex items-center gap-space-xs text-on-surface-variant font-code text-code">
                  <span className="material-symbols-outlined text-error text-[16px]">
                    priority_high
                  </span>
                  <span>SLA breach countdown: 18m 42s</span>
                </div>
              </div>

              {/* Card 3: Field Units Active */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider">
                    Field Units Active
                  </span>
                  <span className="font-code text-code text-on-tertiary-container">
                    83% capacity
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-space-sm">
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-lg text-headline-lg text-primary tracking-tight">
                      05
                    </span>
                    <span className="font-headline-md text-headline-md text-on-surface-variant">
                      / 06
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    crews deployed
                  </span>
                </div>
                <div className="mt-space-md w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: "83%" }}
                  ></div>
                </div>
              </div>

              {/* Card 4: Resolution Velocity */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider">
                    Resolution Velocity
                  </span>
                  <span className="flex items-center text-on-tertiary-container font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px]">
                      trending_up
                    </span>{" "}
                    18%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-space-sm">
                  <span className="font-headline-lg text-headline-lg text-primary tracking-tight">
                    2.1{" "}
                    <span className="font-headline-sm text-headline-sm font-normal text-on-surface-variant">
                      Days
                    </span>
                  </span>
                  <span className="font-label-sm text-label-sm text-on-tertiary-container font-medium">
                    ahead of target
                  </span>
                </div>
                <div className="mt-space-md flex items-center justify-between text-on-surface-variant font-code text-code">
                  <span>Target: 2.6 Days</span>
                  <span>Rolling 30d</span>
                </div>
              </div>
            </div>

            {/* Split Workstation Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              {/* LEFT PANEL (Cols 1-7): Case Queue & Active Dossier */}
              <div className="lg:col-span-7 flex flex-col gap-gutter">
                {/* Search & Filters Toolbar */}
                <div className="bg-surface-container-lowest rounded-xl p-space-md border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title, citizen name, or location..."
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-space-xs font-code text-code text-on-surface-variant">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-background border border-border rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-secondary font-medium"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>

                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="bg-background border border-border rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-secondary font-medium"
                    >
                      <option value="">All Severities</option>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                {/* Selected Dossier or Incident detail list */}
                <div className="space-y-4">
                  <h2 className="font-headline-sm text-headline-sm text-primary">
                    Active Complaint Queue ({filteredComplaints.length})
                  </h2>

                  {loading ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Loading queue...
                    </div>
                  ) : !filteredComplaints.length ? (
                    <div className="p-8 text-center text-xs text-muted-foreground bg-surface-container-lowest rounded-xl border border-border">
                      No complaints match the selected criteria.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredComplaints.map((item) => {
                        const sla = getSlaBadge(item.severity);

                        return (
                          <div
                            key={item.id}
                            className="p-space-lg rounded-xl bg-surface-container-lowest border border-border shadow-sm space-y-3 hover:border-secondary/40 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-sm tracking-tight text-primary">
                                    {item.title}
                                  </span>
                                  <SeverityBadge severity={item.severity} />
                                  <StatusBadge status={item.status} />
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${sla.cls}`}
                                  >
                                    <Timer className="w-3 h-3" />
                                    {sla.text}
                                  </span>
                                </div>
                                <p className="text-xs text-on-surface-variant">
                                  {item.category} • Citizen:{" "}
                                  <span className="font-medium text-foreground">
                                    {item.citizen?.fullName || "Anonymous"}
                                  </span>{" "}
                                  ({item.citizen?.email})
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setAssigningComplaint(item)}
                                  className="px-3 py-1.5 border border-border hover:bg-surface-container-low text-primary rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 bg-surface"
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-secondary" />
                                  <span>Dispatch</span>
                                </button>

                                <button
                                  onClick={() => setAuditComplaint(item)}
                                  className="px-3 py-1.5 border border-border hover:bg-surface-container-low text-primary rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 bg-surface"
                                >
                                  <History className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Audit Log</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedComplaint(item);
                                    setNewStatus(
                                      item.status === "PENDING"
                                        ? "IN_PROGRESS"
                                        : "RESOLVED",
                                    );
                                    setAiSuggestedReply(null);
                                  }}
                                  className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Triage</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-on-surface-variant leading-relaxed">
                              {item.description}
                            </p>

                            {/* Optional Visual Computer Vision Telemetry */}
                            {item.severityScore && (
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md border-t border-surface-container-high pt-3 mt-2">
                                <div className="md:col-span-12 p-2 bg-surface-container-low rounded-lg flex items-center justify-between border border-border">
                                  <div className="flex items-center gap-2 font-code text-code text-on-surface-variant">
                                    <span className="material-symbols-outlined text-secondary text-[16px]">
                                      straighten
                                    </span>
                                    <span>
                                      Detected:{" "}
                                      <strong className="text-primary">
                                        {item.objectType || "ROAD_CAVITY"}
                                      </strong>{" "}
                                      ({item.objectMeasurement || "N/A"})
                                    </span>
                                  </div>
                                  <span className="font-code text-code bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded font-bold">
                                    SEVERITY_IDX: {item.severityScore}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="pt-2 border-t border-surface-container-high flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                              {item.locationName && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#0051d5]" />
                                  <span>{item.locationName}</span>
                                </div>
                              )}

                              {item.assignedTo && (
                                <div className="flex items-center gap-1 text-primary font-medium">
                                  <UserCheck className="w-3.5 h-3.5 text-[#009668]" />
                                  <span>
                                    Assigned to: {item.assignedTo.fullName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT PANEL (Cols 8-12): AI Copilot, Sign-off & Audit Log */}
              <div className="lg:col-span-5 flex flex-col gap-gutter">
                {/* 1. Claude AI Auto-Reply Copilot Card */}
                <div className="bg-surface-container-lowest rounded-xl border border-border p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        smart_toy
                      </span>
                      <span className="font-headline-sm text-headline-sm text-primary tracking-tight">
                        AI Outbound Copilot
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container font-code text-code text-on-surface-variant">
                      Claude 3.5 Sonnet
                    </span>
                  </div>

                  <div className="font-code text-code text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-on-tertiary-container">
                      check_circle
                    </span>
                    <span>
                      Prompt Service: AiService.java#generateReplyTemplate()
                    </span>
                  </div>

                  {/* Generated Message Box */}
                  <div className="p-space-md rounded-xl bg-surface-container-low border border-border flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between text-on-surface-variant font-code text-code">
                      <span className="uppercase font-semibold text-primary">
                        Generated Citizen SMS / Push Preview
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface leading-relaxed italic">
                      "Hi Marcus, thank you for alerting CivicPulse. Unit-4
                      (Lead: Jane Smith) is currently deployed at Main & 5th
                      with hot-mix asphalt compaction equipment. Estimated
                      roadway clearance is 45 minutes."
                    </p>
                  </div>

                  <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-space-lg rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-semibold transition-all shadow-sm active:scale-[0.99]"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      send
                    </span>
                    <span>Send SMS & Push to Citizen</span>
                  </button>
                </div>

                {/* 2. Field Engineering Sign-Off Deck */}
                <div className="bg-surface-container-lowest rounded-xl border border-border p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        engineering
                      </span>
                      <span className="font-headline-sm text-headline-sm text-primary tracking-tight">
                        Engineering Sign-Off Deck
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container font-code text-code text-on-surface-variant">
                      Form #ENG-44B
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-space-sm">
                    <div className="p-space-sm rounded-lg bg-surface-container-low border border-border flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                        Asphalt Mix Tonnage
                      </span>
                      <span className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                        1.85 Tons
                      </span>
                      <span className="font-code text-code text-on-surface-variant">
                        Class: Hot Mix SP-III
                      </span>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-low border border-border flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                        Equipment Deployed
                      </span>
                      <span className="font-label-md text-label-md text-primary font-semibold mt-1">
                        Roller-04, Infrared Heater
                      </span>
                      <span className="font-code text-code text-on-tertiary-container font-medium">
                        GPS Lock Active
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      Supervisor Execution Notes
                    </label>
                    <textarea
                      className="w-full bg-surface-container-low border border-border rounded-lg p-space-sm text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-on-surface-variant"
                      placeholder="Enter post-patch audit telemetry notes..."
                      rows={2}
                      defaultValue="Hot compaction complete. Compaction density registered at 97.2%. Roadway cured and reopened to vehicular transit."
                    />
                  </div>

                  <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-space-lg rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container font-label-md text-label-md font-semibold transition-all shadow-sm active:scale-[0.99]"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      verified_user
                    </span>
                    <span>Execute Supervisor Sign-Off & Close Ticket</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dispatch Modal */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div>
                <h3 className="font-bold text-base">Dispatch Staff Member</h3>
                <p className="text-xs text-on-surface-variant">
                  {assigningComplaint.title}
                </p>
              </div>
              <button
                onClick={() => setAssigningComplaint(null)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignStaff} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant">
                  Select Specialist Technician
                </label>
                <select
                  value={assignedStaffEmail}
                  onChange={(e) => setAssignedStaffEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="tech@roads.gov">
                    Bob Technician (Roads & Infrastructure)
                  </option>
                  <option value="admin@roads.gov">
                    Alice Admin (Department Lead)
                  </option>
                  <option value="water.lead@city.gov">
                    Sarah Specialist (Water & Sanitation)
                  </option>
                  <option value="power.tech@city.gov">
                    Dave Electrician (Power Grid)
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningComplaint(null)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-medium hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-4 py-2 bg-secondary hover:bg-secondary-container text-on-secondary rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {assigning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm Assignment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit History Timeline Modal */}
      {auditComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" />
                  Status Audit Trail
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {auditComplaint.title}
                </p>
              </div>
              <button
                onClick={() => setAuditComplaint(null)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {!auditComplaint.statusHistory ||
              !auditComplaint.statusHistory.length ? (
                <div className="text-xs text-on-surface-variant py-6 text-center">
                  No previous audit notes logged.
                </div>
              ) : (
                auditComplaint.statusHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-container-low border border-border rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-secondary">
                        {item.status}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface">
                      {item.note || "No note added"}
                    </p>
                    <span className="text-[10px] text-on-surface-variant block text-right">
                      Updated by: {item.changedBy}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => setAuditComplaint(null)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-medium hover:bg-surface-container-low"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div>
                <h3 className="font-bold text-base">Update Status</h3>
                <p className="text-xs text-on-surface-variant">
                  {selectedComplaint.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant">
                  Target Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant">
                  Staff Note / Resolution Detail
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Technician dispatched, asphalt patch completed..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aiReply"
                  checked={includeAiReply}
                  onChange={(e) => setIncludeAiReply(e.target.checked)}
                  className="rounded border-border text-secondary focus:ring-secondary"
                />
                <label
                  htmlFor="aiReply"
                  className="text-xs font-medium flex items-center gap-1.5 cursor-pointer text-on-surface"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Generate AI Citizen Response Template</span>
                </label>
              </div>

              {aiSuggestedReply && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <MessageSquareQuote className="w-4 h-4" />
                    <span>AI Generated Response Template:</span>
                  </div>
                  <p className="text-xs leading-relaxed text-on-surface whitespace-pre-line">
                    {aiSuggestedReply}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-medium hover:bg-surface-container-low"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Update</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
