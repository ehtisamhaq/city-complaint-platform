"use client";

import {
  IconArrowRight,
  IconBuildingCommunity,
  IconChartBar,
  IconCircleCheck,
  IconClock,
  IconMapPin,
  IconSearch,
  IconSparkles,
  IconThumbUp,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import {
  categoryLabel,
  categoryShortLabels,
  SeverityBadge,
  StatusBadge,
} from "@/components/Badges";
import Navbar from "@/components/Navbar";
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
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type Complaint,
  type PublicStatisticsData,
  publicApi,
} from "@/lib/api";

const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] w-full rounded-lg" />,
});

const CATEGORIES = ["ROADS", "WATER", "LIGHTING", "WASTE"] as const;
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function PublicBoardPage() {
  const router = useRouter();
  const [statsData, setStatsData] = useState<PublicStatisticsData | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [intent, setIntent] = useState("");

  const [endorsements, setEndorsements] = useState<Record<string, number>>({});
  const [endorsed, setEndorsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          publicApi.getStats(),
          publicApi.getComplaints({ page: 0, size: 30 }),
        ]);
        if (!active) return;

        setStatsData(statsRes.data);
        const list = complaintsRes.data?.content ?? [];
        setComplaints(list);
        setEndorsements(
          Object.fromEntries(
            list.map((item, index) => [item.id, ((index * 7 + 3) % 19) + 5]),
          ),
        );
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not reach the complaint service",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return complaints.filter((item) => {
      const matchesTerm =
        !term ||
        item.title?.toLowerCase().includes(term) ||
        item.locationName?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term);
      const matchesCategory = category === "ALL" || item.category === category;
      const matchesSeverity = severity === "ALL" || item.severity === severity;
      return matchesTerm && matchesCategory && matchesSeverity;
    });
  }, [complaints, search, category, severity]);

  const toggleEndorse = (id: string) => {
    setEndorsed((prev) => {
      const wasEndorsed = Boolean(prev[id]);
      setEndorsements((curr) => ({
        ...curr,
        [id]: Math.max((curr[id] ?? 0) + (wasEndorsed ? -1 : 1), 0),
      }));
      return { ...prev, [id]: !wasEndorsed };
    });
  };

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
        })),
    [complaints],
  );

  const stats = statsData?.stats;
  const resolutionRate =
    stats && stats.totalComplaints > 0
      ? Math.round(((stats.resolved ?? 0) / stats.totalComplaints) * 100)
      : 0;

  const headline = [
    { label: "Total reports", value: stats?.totalComplaints, icon: IconMapPin },
    { label: "Needs review", value: stats?.pending, icon: IconClock },
    { label: "In progress", value: stats?.inProgress, icon: IconSparkles },
    { label: "Resolved", value: stats?.resolved, icon: IconCircleCheck },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Hero */}
        <section className="mb-8 grid gap-6 lg:mb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              Live city feed
            </Badge>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              Report a problem. Track it to the fix.
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Every service request filed here is tracked from triage to
              resolution, and published openly as it progresses.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Link
              href="/report"
              className={buttonVariants({ size: "lg", className: "gap-2" })}
            >
              Report an issue
              <IconArrowRight className="size-4" />
            </Link>
            <Link
              href="/citizen/dashboard"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "gap-2",
              })}
            >
              Track my requests
            </Link>
          </div>
        </section>

        {/* Headline stats */}
        <section className="mb-8 grid grid-cols-2 gap-3 lg:mb-12 lg:grid-cols-4 lg:gap-4">
          {headline.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} size="sm">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.label}
                    </span>
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <span className="text-2xl font-bold tabular-nums lg:text-3xl">
                      {item.value ?? 0}
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Quick intake + resolution summary */}
        <section className="mb-8 grid gap-4 lg:mb-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Describe the problem</CardTitle>
              <CardDescription>
                Start a report in your own words — the intake form triages
                severity and routes it to the right department.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const description = intent.trim();
                  router.push(
                    description
                      ? `/report?description=${encodeURIComponent(description)}`
                      : "/report",
                  );
                }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <Input
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                  placeholder="e.g. Deep pothole outside 442 Main Street"
                  aria-label="Describe the problem"
                  className="h-10 flex-1"
                />
                <Button type="submit" size="lg" className="gap-2 sm:w-auto">
                  Continue
                  <IconArrowRight className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolution rate</CardTitle>
              <CardDescription>All published cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <Skeleton className="h-12 w-24" />
              ) : (
                <span className="text-3xl font-bold tabular-nums">
                  {resolutionRate}%
                </span>
              )}
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={resolutionRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Resolution rate"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Map */}
        <section className="mb-8 lg:mb-12">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Reported locations</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading reports…"
                  : `${markers.length} geotagged ${
                      markers.length === 1 ? "report" : "reports"
                    }`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadError ? (
                <Empty className="py-12">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <IconBuildingCommunity />
                    </EmptyMedia>
                    <EmptyTitle>Map unavailable</EmptyTitle>
                    <EmptyDescription>{loadError}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <MapboxMap
                  markers={markers}
                  interactive={false}
                  className="h-[280px] w-full overflow-hidden rounded-lg border sm:h-[380px]"
                />
              )}
            </CardContent>
          </Card>
        </section>

        {/* Complaint directory */}
        <section className="mb-8 lg:mb-12">
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle>Open case directory</CardTitle>
                <CardDescription>
                  Every request published by the city, newest first.
                </CardDescription>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search title, location, or category"
                    aria-label="Search reports"
                    className="pl-9"
                  />
                </div>
                <NativeSelect
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  aria-label="Filter by category"
                  className="w-full sm:w-48"
                >
                  <NativeSelectOption value="ALL">
                    All categories
                  </NativeSelectOption>
                  {CATEGORIES.map((value) => (
                    <NativeSelectOption key={value} value={value}>
                      {categoryShortLabels[value]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value)}
                  aria-label="Filter by severity"
                  className="w-full sm:w-44"
                >
                  <NativeSelectOption value="ALL">
                    All severities
                  </NativeSelectOption>
                  {SEVERITIES.map((value) => (
                    <NativeSelectOption key={value} value={value}>
                      {value.charAt(0) + value.slice(1).toLowerCase()}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2, 3, 4, 5].map((key) => (
                    <Skeleton key={key} className="h-40 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <Empty className="py-14">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <IconSearch />
                    </EmptyMedia>
                    <EmptyTitle>No matching reports</EmptyTitle>
                    <EmptyDescription>
                      {complaints.length === 0
                        ? "No cases have been published yet."
                        : "Try clearing the filters or searching for something else."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Showing {filtered.length} of {complaints.length} reports
                  </p>
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((item) => {
                      const count = endorsements[item.id] ?? 0;
                      const isEndorsed = Boolean(endorsed[item.id]);
                      return (
                        <li key={item.id}>
                          <Card size="sm" className="flex h-full flex-col">
                            <CardHeader className="gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <SeverityBadge severity={item.severity} />
                                <StatusBadge status={item.status} />
                              </div>
                              <CardTitle className="line-clamp-2 text-sm leading-snug">
                                {item.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="mt-auto flex flex-1 flex-col gap-3">
                              <p className="line-clamp-3 text-sm text-muted-foreground">
                                {item.description}
                              </p>
                              <div className="mt-auto space-y-1 text-xs text-muted-foreground">
                                <p className="flex items-center gap-1.5">
                                  <IconMapPin className="size-3.5 shrink-0" />
                                  <span className="truncate">
                                    {item.locationName ||
                                      categoryLabel(item.category)}
                                  </span>
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <IconClock className="size-3.5 shrink-0" />
                                  {formatDate(item.createdAt)}
                                </p>
                              </div>
                              <Button
                                variant={isEndorsed ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => toggleEndorse(item.id)}
                                aria-pressed={isEndorsed}
                                className="w-full gap-2"
                              >
                                <IconThumbUp className="size-3.5" />
                                {isEndorsed ? "Endorsed" : "Endorse"}
                                <span className="tabular-nums text-muted-foreground">
                                  {count}
                                </span>
                              </Button>
                            </CardContent>
                          </Card>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Analytics */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <IconChartBar className="size-4 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              Where the city is spending its time
            </h2>
          </div>
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[0, 1].map((key) => (
                <Skeleton key={key} className="h-80 w-full" />
              ))}
            </div>
          ) : (
            <AnalyticsCharts
              byCategory={statsData?.byCategory ?? {}}
              byDepartment={statsData?.byDepartment ?? []}
            />
          )}
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="font-heading text-sm font-semibold">CityPulse</p>
            <p className="text-xs text-muted-foreground">
              Municipal complaint and service request platform
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link
              href="/report"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Report an issue
            </Link>
            <Link
              href="/citizen/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              My requests
            </Link>
            <Link
              href="/staff/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Staff sign in
            </Link>
            <a
              href="/api/public/export/json"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Open data
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
