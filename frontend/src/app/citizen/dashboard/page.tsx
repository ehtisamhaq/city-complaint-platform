"use client";

import {
  IconArrowRight,
  IconCircleCheck,
  IconClock,
  IconExternalLink,
  IconHistory,
  IconInbox,
  IconMapPin,
  IconPlus,
  IconSparkles,
  IconTimeline,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { categoryLabel, SeverityBadge, StatusBadge } from "@/components/Badges";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportModal from "@/components/ReportModal";
import { type CitizenDashboardData, citizenApi, type User } from "@/lib/api";

import { getClientUser } from "@/lib/auth";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "triage", label: "Needs review" },
  { value: "active", label: "In progress" },
  { value: "resolved", label: "Resolved" },
] as const;

const EMPTY_STATS = {
  totalComplaints: 0,
  pending: 0,
  inProgress: 0,
  resolved: 0,
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function CitizenDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <CitizenDashboard />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="mt-8 h-80 w-full" />
      </main>
    </div>
  );
}

function CitizenDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSubmitted = searchParams.get("submitted") === "1";

  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<CitizenDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [reportOpen, setReportOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await citizenApi.getDashboard();
      setData(response.data);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Could not reach the complaint service",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUser(getClientUser());
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!justSubmitted) return;
    // Clear the flag so a refresh does not re-show the banner.
    router.replace("/citizen/dashboard");
  }, [justSubmitted, router]);

  const complaints = data?.recentComplaints ?? [];
  const stats = data?.stats ?? EMPTY_STATS;

  const filtered = useMemo(() => {
    if (filter === "triage")
      return complaints.filter((c) => c.status === "PENDING");
    if (filter === "active")
      return complaints.filter(
        (c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED",
      );
    if (filter === "resolved")
      return complaints.filter(
        (c) => c.status === "RESOLVED" || c.status === "CLOSED",
      );
    return complaints;
  }, [complaints, filter]);

  const counts = useMemo(
    () => ({
      all: complaints.length,
      triage: complaints.filter((c) => c.status === "PENDING").length,
      active: complaints.filter(
        (c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED",
      ).length,
      resolved: complaints.filter(
        (c) => c.status === "RESOLVED" || c.status === "CLOSED",
      ).length,
    }),
    [complaints],
  );

  // Resolved / history complaints
  const historyComplaints = useMemo(
    () =>
      complaints.filter(
        (c) => c.status === "RESOLVED" || c.status === "CLOSED",
      ),
    [complaints],
  );

  const firstName = user?.fullName?.split(" ")[0] || "there";

  const headline = [
    { label: "Total requests", value: stats.totalComplaints },
    { label: "Needs review", value: stats.pending },
    { label: "In progress", value: stats.inProgress },
    { label: "Resolved", value: stats.resolved },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {justSubmitted ? (
          <Alert className="mb-6">
            <IconCircleCheck className="size-4" />
            <AlertTitle>Report submitted</AlertTitle>
            <AlertDescription>
              The city has your request. Severity is being scored and it will be
              routed to the right department shortly.
            </AlertDescription>
          </Alert>
        ) : null}

        {loadError ? (
          <Alert variant="destructive" className="mb-6">
            <IconClock className="size-4" />
            <AlertTitle>Could not load your requests</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Hello, {firstName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you have reported, and where each one stands.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setReportOpen(true)}
            className="gap-2 bg-amber-500 text-black hover:bg-amber-400"
          >
            <IconPlus className="size-4" />
            Report an issue
          </Button>
        </div>

        {/* Stats */}
        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {headline.map((item) => (
            <Card key={item.label} size="sm">
              <CardContent className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-bold tabular-nums lg:text-3xl">
                    {item.value}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Requests */}
        <Card className="mb-6">
          <CardHeader className="gap-4">
            <div>
              <CardTitle>Your requests</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading your requests…"
                  : `${filtered.length} of ${complaints.length} shown`}
              </CardDescription>
            </div>
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value ?? "all")}
            >
              <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
                {FILTERS.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                    <span className="ml-1 tabular-nums text-muted-foreground">
                      {counts[item.value]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((key) => (
                  <Skeleton key={key} className="h-24 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Empty className="py-14">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    {complaints.length === 0 ? <IconInbox /> : <IconSparkles />}
                  </EmptyMedia>
                  <EmptyTitle>
                    {complaints.length === 0
                      ? "Nothing reported yet"
                      : "Nothing in this view"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {complaints.length === 0
                      ? "When you report a problem it will appear here with live progress."
                      : "Try another filter to see your other requests."}
                  </EmptyDescription>
                </EmptyHeader>
                {complaints.length === 0 ? (
                  <Link
                    href="/report"
                    className={buttonVariants({ className: "gap-2" })}
                  >
                    Report an issue
                    <IconArrowRight className="size-4" />
                  </Link>
                ) : null}
              </Empty>
            ) : (
              <ul className="space-y-3">
                {filtered.map((complaint) => (
                  <li key={complaint.id}>
                    <Card
                      size="sm"
                      className="transition-colors hover:bg-muted/40"
                    >
                      <CardHeader className="gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <SeverityBadge severity={complaint.severity} />
                          <StatusBadge status={complaint.status} />
                        </div>
                        <CardTitle className="text-sm leading-snug sm:text-base">
                          {complaint.title}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>{categoryLabel(complaint.category)}</span>
                          <span className="flex items-center gap-1">
                            <IconMapPin className="size-3" />
                            {complaint.locationName || "No location"}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconClock className="size-3" />
                            Reported {formatDate(complaint.createdAt)}
                          </span>
                        </CardDescription>
                      </CardHeader>

                      {complaint.description ? (
                        <CardContent>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {complaint.description}
                          </p>
                          {complaint.resolutionNotes &&
                          (complaint.status === "RESOLVED" ||
                            complaint.status === "CLOSED") ? (
                            <p className="mt-3 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
                              <span className="font-medium text-success">
                                Resolution:{" "}
                              </span>
                              {complaint.resolutionNotes}
                            </p>
                          ) : null}
                        </CardContent>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Complaint History / Resolved Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconHistory className="size-5 text-muted-foreground" />
              <div>
                <CardTitle>Resolution history</CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading history…"
                    : historyComplaints.length === 0
                      ? "No resolved complaints yet"
                      : `${historyComplaints.length} complaint${historyComplaints.length === 1 ? "" : "s"} resolved or closed`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[0, 1].map((key) => (
                  <Skeleton key={key} className="h-20 w-full" />
                ))}
              </div>
            ) : historyComplaints.length === 0 ? (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconTimeline />
                  </EmptyMedia>
                  <EmptyTitle>No history yet</EmptyTitle>
                  <EmptyDescription>
                    Resolved and closed complaints will appear here with their
                    full timeline.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ol className="relative border-l border-border pl-6 space-y-6">
                {historyComplaints.map((complaint, idx) => (
                  <li key={complaint.id} className="relative">
                    {/* Timeline dot */}
                    <span
                      className={`absolute -left-[1.6rem] top-1 flex size-4 items-center justify-center rounded-full border-2 ${
                        complaint.status === "CLOSED"
                          ? "border-muted-foreground bg-muted"
                          : "border-success bg-success/10"
                      }`}
                    >
                      <IconCircleCheck
                        className={`size-2.5 ${
                          complaint.status === "CLOSED"
                            ? "text-muted-foreground"
                            : "text-success"
                        }`}
                      />
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={complaint.status} />
                        <SeverityBadge severity={complaint.severity} />
                        <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                          <IconClock className="size-3" />
                          {complaint.resolvedAt
                            ? formatDateTime(complaint.resolvedAt)
                            : formatDate(complaint.updatedAt)}
                        </span>
                      </div>

                      <p className="text-sm font-medium">{complaint.title}</p>

                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconMapPin className="size-3 shrink-0" />
                        {complaint.locationName || "No location"}
                        <span className="mx-1">·</span>
                        {categoryLabel(complaint.category)}
                      </p>

                      {complaint.resolutionNotes ? (
                        <>
                          <Separator className="my-2" />
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Resolution:{" "}
                            </span>
                            {complaint.resolutionNotes}
                          </p>
                        </>
                      ) : null}

                      {/* Status timeline entries */}
                      {complaint.statusHistory &&
                      complaint.statusHistory.length > 0 ? (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                            <IconTimeline className="size-3" />
                            View {complaint.statusHistory.length} status update
                            {complaint.statusHistory.length === 1 ? "" : "s"}
                          </summary>
                          <ol className="mt-2 space-y-2 border-l border-border pl-4">
                            {[...complaint.statusHistory]
                              .reverse()
                              .map((entry, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-muted-foreground"
                                >
                                  <span className="font-medium text-foreground">
                                    {entry.status
                                      .replace(/_/g, " ")
                                      .toLowerCase()}
                                  </span>{" "}
                                  · {formatDateTime(entry.createdAt)}
                                  {entry.note ? (
                                    <p className="mt-0.5 text-muted-foreground">
                                      {entry.note}
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                          </ol>
                        </details>
                      ) : null}
                    </div>

                    {idx < historyComplaints.length - 1 ? null : null}
                  </li>
                ))}
              </ol>
            )}

            {/* Link to full registry */}
            {!loading && (
              <div className="mt-6 flex justify-end">
                <Link
                  href="/complaints"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IconExternalLink className="size-4" />
                  View all city complaints
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
