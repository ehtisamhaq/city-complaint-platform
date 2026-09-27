"use client";

import { useCallback, useEffect, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/Badges";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { CitizenDashboardData, User } from "@/lib/api";
import { citizenApi } from "@/lib/api";
import { getClientUser } from "@/lib/auth";

const filters = [
  { id: "all", label: "All requests" },
  { id: "active", label: "In progress" },
  { id: "triage", label: "Needs review" },
  { id: "resolved", label: "Resolved" },
];

const categoryLabels: Record<string, string> = {
  ROADS: "Roads & infrastructure",
  WATER: "Water & sanitation",
  LIGHTING: "Lighting & power",
  WASTE: "Sanitation & waste",
};

export default function CitizenDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<CitizenDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: "",
    description: "",
    category: "ROADS",
    locationName: "",
    latitude: 40.7128,
    longitude: -74.006,
  });

  const loadDashboard = useCallback(async () => {
    try {
      const response = await citizenApi.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error("Failed to load citizen dashboard", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUser(getClientUser());
    loadDashboard();
  }, [loadDashboard]);

  const handleCreateComplaint = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await citizenApi.createComplaint(newComplaint);
      setIsNewModalOpen(false);
      setNewComplaint({
        title: "",
        description: "",
        category: "ROADS",
        locationName: "",
        latitude: 40.7128,
        longitude: -74.006,
      });
      await loadDashboard();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to create complaint",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const complaints = data?.recentComplaints ?? [];
  const stats = data?.stats ?? {
    totalComplaints: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  };
  const filteredComplaints = complaints.filter((complaint) => {
    if (activeFilter === "active")
      return (
        complaint.status === "IN_PROGRESS" || complaint.status === "ASSIGNED"
      );
    if (activeFilter === "triage") return complaint.status === "PENDING";
    if (activeFilter === "resolved")
      return complaint.status === "RESOLVED" || complaint.status === "CLOSED";
    return true;
  });
  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-310 px-5 pb-16 pt-24 sm:px-8">
        <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-secondary" /> Resident
              portal <span className="text-muted-foreground/50">/</span> Ward 4
            </div>
            <h1 className="font-headline-lg text-[34px] font-bold leading-tight text-foreground">
              Good morning, {firstName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep an eye on your neighborhood. Here is the latest from your
              requests.
            </p>
          </div>
          <Button size="lg" onClick={() => setIsNewModalOpen(true)}>
            <span className="material-symbols-outlined text-[19px]">add</span>{" "}
            Report an issue
          </Button>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Total requests", stats.totalComplaints, "All time", "inbox"],
            [
              "Needs review",
              stats.pending,
              "Awaiting triage",
              "pending_actions",
            ],
            ["In progress", stats.inProgress, "Being worked on", "engineering"],
            ["Resolved", stats.resolved, "Closed successfully", "task_alt"],
          ].map(([label, value, detail, icon], index) => (
            <Card key={label} size="sm" className="p-4 sm:p-5">
              <CardContent className="gap-0 p-0">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {label}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[19px] ${index === 3 ? "text-secondary" : "text-primary"}`}
                  >
                    {icon}
                  </span>
                </div>
                <div className="text-3xl font-bold tracking-[-0.04em] text-foreground">
                  {value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {detail}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <Card className="min-w-0">
            <CardHeader className="border-b px-5 pb-4 pt-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Your requests
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Track progress across every report you have filed.
                  </CardDescription>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  type="button"
                  className="hidden sm:inline-flex"
                >
                  View history <span aria-hidden="true">→</span>
                </Button>
              </div>
            </CardHeader>
            <div className="flex gap-1 overflow-x-auto border-b px-5 pt-3 sm:px-6">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`whitespace-nowrap border-b-2 px-1 pb-3 text-xs font-semibold transition ${activeFilter === filter.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading requests...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No requests found for this view.
              </div>
            ) : (
              <div id="history" className="divide-y">
                {filteredComplaints.map((complaint) => (
                  <article
                    key={complaint.id}
                    className="flex flex-col gap-3 px-5 py-5 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-[11px] text-primary"
                        >
                          #{complaint.id.slice(0, 8)}
                        </Badge>
                        <SeverityBadge severity={complaint.severity} />
                        <StatusBadge status={complaint.status} />
                      </div>
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {complaint.title}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {categoryLabels[complaint.category] ||
                          complaint.category}{" "}
                        <span className="mx-1">•</span>{" "}
                        {complaint.locationName || "Location pending"}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <div className="text-xs font-medium text-muted-foreground">
                        Updated
                      </div>
                      <div className="mt-1 text-xs font-semibold text-foreground">
                        {new Date(
                          complaint.updatedAt || complaint.createdAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <aside className="space-y-6">
            <Card className="border-secondary/20 bg-secondary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-secondary-foreground">
                    City pulse
                  </CardTitle>
                  <Badge variant="secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />{" "}
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-5 flex items-end gap-2">
                  <span className="text-4xl font-bold leading-none text-secondary-foreground">
                    94%
                  </span>
                  <span className="pb-1 text-xs text-muted-foreground">
                    services on track
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary/20">
                  <div className="h-full w-[94%] rounded-full bg-secondary" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-secondary/20 pt-4">
                  <div>
                    <div className="text-xl font-bold text-secondary-foreground">
                      2.4h
                    </div>
                    <div className="text-xs text-muted-foreground">
                      avg response
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-secondary-foreground">
                      18
                    </div>
                    <div className="text-xs text-muted-foreground">
                      active crews
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need a hand?</CardTitle>
                <CardDescription className="text-xs">
                  Ask City AI about services, policies, or request status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" type="button" className="w-full">
                  <span className="material-symbols-outlined text-[17px]">
                    auto_awesome
                  </span>{" "}
                  Ask City AI
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Report an issue</CardTitle>
                  <CardDescription>
                    Give the city enough detail to route it quickly.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateComplaint} className="space-y-4">
                <label
                  htmlFor="complaint-title"
                  className="block text-sm font-medium"
                >
                  Title
                  <Input
                    id="complaint-title"
                    required
                    value={newComplaint.title}
                    onChange={(event) =>
                      setNewComplaint({
                        ...newComplaint,
                        title: event.target.value,
                      })
                    }
                    className="mt-1.5"
                    placeholder="What needs attention?"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label
                    htmlFor="complaint-category"
                    className="block text-sm font-medium"
                  >
                    Category
                    <NativeSelect
                      id="complaint-category"
                      value={newComplaint.category}
                      onChange={(event) =>
                        setNewComplaint({
                          ...newComplaint,
                          category: event.target.value,
                        })
                      }
                      className="mt-1.5 w-full"
                    >
                      <NativeSelectOption value="ROADS">
                        Roads &amp; infrastructure
                      </NativeSelectOption>
                      <NativeSelectOption value="WATER">
                        Water &amp; sanitation
                      </NativeSelectOption>
                      <NativeSelectOption value="LIGHTING">
                        Lighting &amp; power
                      </NativeSelectOption>
                      <NativeSelectOption value="WASTE">
                        Sanitation &amp; waste
                      </NativeSelectOption>
                    </NativeSelect>
                  </label>
                  <label
                    htmlFor="complaint-location"
                    className="block text-sm font-medium"
                  >
                    Location
                    <Input
                      id="complaint-location"
                      value={newComplaint.locationName}
                      onChange={(event) =>
                        setNewComplaint({
                          ...newComplaint,
                          locationName: event.target.value,
                        })
                      }
                      className="mt-1.5"
                      placeholder="Street or landmark"
                    />
                  </label>
                </div>
                <label
                  htmlFor="complaint-description"
                  className="block text-sm font-medium"
                >
                  Description
                  <Textarea
                    id="complaint-description"
                    required
                    rows={4}
                    value={newComplaint.description}
                    onChange={(event) =>
                      setNewComplaint({
                        ...newComplaint,
                        description: event.target.value,
                      })
                    }
                    className="mt-1.5"
                    placeholder="Add useful context..."
                  />
                </label>
                <Button disabled={submitting} className="w-full" type="submit">
                  {submitting ? "Submitting..." : "Submit report"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
