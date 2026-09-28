"use client";

import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconFilter,
  IconHistory,
  IconInbox,
  IconMapPin,
  IconSearch,
  IconShield,
  IconSparkles,
  IconTool,
  IconUserPlus,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { categoryLabel, SeverityBadge, StatusBadge } from "@/components/Badges";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  type Complaint,
  type StaffDashboardData,
  type StaffMember,
  staffApi,
  type User,
} from "@/lib/api";
import { getClientUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Needs review" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
] as const;

const SEVERITIES = [
  { value: "", label: "All severities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
] as const;

const WORKFLOW_STATUSES = ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

/** Response windows the city publishes per severity band. */
const SLA_BY_SEVERITY: Record<string, string> = {
  CRITICAL: "4h",
  HIGH: "12h",
  MEDIUM: "24h",
  LOW: "48h",
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

export default function StaffDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [statusTarget, setStatusTarget] = useState<Complaint | null>(null);
  const [nextStatus, setNextStatus] = useState("IN_PROGRESS");
  const [note, setNote] = useState("");
  const [includeAiReply, setIncludeAiReply] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [aiReply, setAiReply] = useState<string | null>(null);

  const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
  const [assigneeId, setAssigneeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [auditTarget, setAuditTarget] = useState<Complaint | null>(null);

  const load = useCallback(async () => {
    try {
      const [dashboardRes, listRes, membersRes] = await Promise.all([
        staffApi.getDashboard(),
        staffApi.getAllComplaints({
          status: status || undefined,
          severity: severity || undefined,
        }),
        staffApi.getMembers(),
      ]);
      setData(dashboardRes.data);
      setComplaints(listRes.data?.content ?? []);
      setStaffMembers(membersRes.data ?? []);
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
  }, [status, severity]);

  useEffect(() => {
    const current = getClientUser();
    setUser(current);
    // proxy.ts only checks that a token exists, so a citizen can reach this
    // route. Bounce them before the first request turns into a 403.
    if (current?.role === "CITIZEN") {
      window.location.replace("/citizen/dashboard");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = user?.role === "ADMIN";
  const isTechnician = user?.role === "TECHNICIAN";

  // Technicians only see their own assigned complaints
  const visible = useMemo(() => {
    let list = complaints;

    // Technicians: filter to only complaints assigned to them
    if (isTechnician && user) {
      list = list.filter((c) => c.assignedTo?.email === user.email);
    }

    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((item) =>
      [
        item.title,
        item.locationName,
        item.category,
        item.citizen?.fullName,
        item.assignedTo?.fullName,
      ].some((field) => field?.toLowerCase().includes(term) ?? false),
    );
  }, [complaints, search, isTechnician, user]);

  const openStatusDialog = (complaint: Complaint) => {
    setStatusTarget(complaint);
    setNextStatus(complaint.status === "PENDING" ? "ASSIGNED" : "IN_PROGRESS");
    setNote("");
    setAiReply(null);
    setActionError(null);
  };

  const saveStatus = async () => {
    if (!statusTarget) return;
    setSaving(true);
    setActionError(null);

    try {
      const res = await staffApi.updateStatus(statusTarget.id, {
        status: nextStatus,
        note: note.trim() || undefined,
        includeAiReply,
      });
      if (res.data?.suggestedReply) {
        setAiReply(res.data.suggestedReply);
      } else {
        setStatusTarget(null);
      }
      await load();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "The status could not be saved",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveAssignment = async () => {
    if (!assignTarget || !assigneeId.trim()) return;
    setAssigning(true);
    setActionError(null);

    try {
      await staffApi.assign(assignTarget.id, assigneeId.trim());
      setAssignTarget(null);
      setAssigneeId("");
      await load();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "The assignment could not be saved",
      );
    } finally {
      setAssigning(false);
    }
  };

  const stats = data?.stats;

  // Admin sees all-queue stats; technician sees their personal stats
  const headline = isAdmin
    ? [
        { label: "Total cases", value: complaints.length },
        { label: "Needs review", value: stats?.pending },
        { label: "In progress", value: stats?.inProgress },
        { label: "Resolved", value: stats?.resolved },
      ]
    : [
        { label: "Assigned to you", value: stats?.totalAssigned },
        { label: "Needs review", value: stats?.pending },
        { label: "In progress", value: stats?.inProgress },
        { label: "Resolved", value: stats?.resolved },
      ];

  const activeFilterCount =
    (status ? 1 : 0) + (severity ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                Operations
              </Badge>
              {/* Role badge */}
              {isAdmin ? (
                <Badge className="gap-1.5 bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">
                  <IconShield className="size-3" />
                  Admin
                </Badge>
              ) : isTechnician ? (
                <Badge className="gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20">
                  <IconTool className="size-3" />
                  Technician
                </Badge>
              ) : null}
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {isAdmin ? "Operations centre" : "My case queue"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {user?.fullName
                ? `Signed in as ${user.fullName}${
                    user.departmentName ? ` · ${user.departmentName}` : ""
                  }`
                : isAdmin
                  ? "Full access — assign, triage and resolve all city service requests."
                  : "Your assigned cases. Update status and keep residents informed."}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="gap-2 lg:hidden"
            aria-expanded={filtersOpen}
          >
            <IconFilter className="size-4" />
            Filters
            {activeFilterCount > 0 ? (
              <Badge
                variant="secondary"
                className="ml-0.5 h-4 px-1.5 text-[10px]"
              >
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
        </div>

        {loadError ? (
          <Alert variant="destructive" className="mb-4">
            <IconAlertTriangle className="size-4" />
            <AlertTitle>Could not load the queue</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => window.location.assign("/staff/login")}
                className="font-medium underline underline-offset-4"
              >
                Sign in again
              </button>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Role-access info banner for technicians */}
        {isTechnician ? (
          <Alert className="mb-4 border-blue-500/20 bg-blue-500/5">
            <IconTool className="size-4 text-blue-500" />
            <AlertTitle className="text-blue-700 dark:text-blue-400">Technician view</AlertTitle>
            <AlertDescription className="text-blue-600 dark:text-blue-300">
              You can see and update the status of cases assigned to you. Contact an admin to reassign cases.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Stats */}
        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
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
                    {item.value ?? 0}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent
            className={cn(
              "grid gap-3",
              filtersOpen ? "grid" : "hidden lg:grid",
              "lg:grid-cols-[minmax(0,1fr)_auto_auto]",
            )}
          >
            <div className="relative">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, location, category, or person"
                aria-label="Search cases"
                className="pl-9"
              />
            </div>
            {/* Status filter — admins see all, technicians see only active-relevant */}
            {isAdmin ? (
              <NativeSelect
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Filter by status"
                className="w-full lg:w-44"
              >
                {STATUSES.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            ) : null}
            <NativeSelect
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              aria-label="Filter by severity"
              className="w-full lg:w-44"
            >
              {SEVERITIES.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </CardContent>
        </Card>

        {/* Queue */}
        <Card>
          <CardHeader>
            <CardTitle>{isAdmin ? "All cases" : "My assigned cases"}</CardTitle>
            <CardDescription>
              {loading
                ? "Loading…"
                : `${visible.length} ${visible.length === 1 ? "case" : "cases"}${
                    activeFilterCount > 0 ? " matching your filters" : ""
                  }`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((key) => (
                  <Skeleton key={key} className="h-16 w-full" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <Empty className="py-14">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconInbox />
                  </EmptyMedia>
                  <EmptyTitle>No cases to show</EmptyTitle>
                  <EmptyDescription>
                    {isTechnician && complaints.length > 0
                      ? "No cases are assigned to you yet."
                      : complaints.length === 0
                        ? "The queue is empty."
                        : "Adjust or clear the filters to see more."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto rounded-lg border md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((complaint) => (
                        <TableRow key={complaint.id}>
                          <TableCell className="max-w-72">
                            <span className="block truncate font-medium">
                              {complaint.title}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <IconMapPin className="size-3 shrink-0" />
                              <span className="truncate">
                                {complaint.locationName || "No location"}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {categoryLabel(complaint.category)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              <SeverityBadge severity={complaint.severity} />
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                SLA{" "}
                                {SLA_BY_SEVERITY[complaint.severity] ?? "48h"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={complaint.status} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {complaint.assignedTo?.fullName ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openStatusDialog(complaint)}
                              >
                                Update
                              </Button>
                              {/* Assign button — admin only */}
                              {isAdmin ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    setAssignTarget(complaint);
                                    setAssigneeId(
                                      complaint.assignedTo?.id ?? "",
                                    );
                                    setActionError(null);
                                  }}
                                  aria-label={`Assign ${complaint.title}`}
                                >
                                  <IconUserPlus className="size-4" />
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setAuditTarget(complaint)}
                                aria-label={`View history for ${complaint.title}`}
                              >
                                <IconHistory className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <ul className="space-y-3 md:hidden">
                  {visible.map((complaint) => (
                    <li key={complaint.id}>
                      <Card size="sm">
                        <CardHeader className="gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <SeverityBadge severity={complaint.severity} />
                            <StatusBadge status={complaint.status} />
                          </div>
                          <CardTitle className="text-sm leading-snug">
                            {complaint.title}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{categoryLabel(complaint.category)}</span>
                            <span className="flex items-center gap-1">
                              <IconMapPin className="size-3" />
                              {complaint.locationName || "No location"}
                            </span>
                            <span className="flex items-center gap-1 tabular-nums">
                              <IconClock className="size-3" />
                              {formatDate(complaint.createdAt)}
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => openStatusDialog(complaint)}
                            className="flex-1 gap-1.5"
                          >
                            Update status
                            <IconArrowRight className="size-3.5" />
                          </Button>
                          {isAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAssignTarget(complaint);
                                setAssigneeId(complaint.assignedTo?.id ?? "");
                                setActionError(null);
                              }}
                              className="gap-1.5"
                            >
                              <IconUserPlus className="size-3.5" />
                              Assign
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setAuditTarget(complaint)}
                            aria-label={`View history for ${complaint.title}`}
                          >
                            <IconHistory className="size-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Status update */}
      <Dialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update status</DialogTitle>
            <DialogDescription>{statusTarget?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionError ? (
              <Alert variant="destructive">
                <IconAlertTriangle className="size-4" />
                <AlertTitle>Could not save</AlertTitle>
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="next-status">New status</FieldLabel>
              <NativeSelect
                id="next-status"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value)}
                className="w-full"
              >
                {WORKFLOW_STATUSES.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {STATUSES.find((option) => option.value === value)?.label ??
                      value}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="status-note">
                Note for the audit trail{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                id="status-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Crew dispatched, temporary signage in place."
              />
            </Field>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <label
                  htmlFor="ai-reply"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <IconSparkles className="size-4 text-muted-foreground" />
                  Draft a resident update
                </label>
                <p className="text-xs text-muted-foreground">
                  Generates a reply from the change note for staff review.
                </p>
              </div>
              <Switch
                id="ai-reply"
                checked={includeAiReply}
                onCheckedChange={setIncludeAiReply}
              />
            </div>

            {aiReply ? (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <IconSparkles className="size-3.5" />
                  Suggested reply — review before sending
                </p>
                <p className="text-sm whitespace-pre-line">{aiReply}</p>
                <Button
                  size="sm"
                  onClick={() => {
                    setStatusTarget(null);
                    setAiReply(null);
                  }}
                  className="gap-1.5"
                >
                  <IconCheck className="size-3.5" />
                  Accept and close
                </Button>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusTarget(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            {!aiReply ? (
              <Button onClick={saveStatus} disabled={saving} className="gap-2">
                {saving ? <Spinner /> : null}
                Save status
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment — admin only */}
      <Dialog
        open={Boolean(assignTarget)}
        onOpenChange={(open) => !open && setAssignTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign this case</DialogTitle>
            <DialogDescription>
              Select a staff member to assign this case to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionError ? (
              <Alert variant="destructive">
                <IconAlertTriangle className="size-4" />
                <AlertTitle>Could not assign</AlertTitle>
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel>Assign to</FieldLabel>
              <Select
                value={assigneeId}
                onValueChange={(val) => setAssigneeId(val ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a staff member…" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No staff members found
                    </div>
                  ) : (
                    staffMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <span className="font-medium">{member.fullName}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {member.role === "ADMIN" ? "Admin" : "Technician"}
                          {member.departmentName
                            ? ` · ${member.departmentName}`
                            : ""}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignTarget(null)}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              onClick={saveAssignment}
              disabled={assigning || !assigneeId.trim()}
              className="gap-2"
            >
              {assigning ? <Spinner /> : <IconUserPlus className="size-4" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit history */}
      <Dialog
        open={Boolean(auditTarget)}
        onOpenChange={(open) => !open && setAuditTarget(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Case history</DialogTitle>
            <DialogDescription>{auditTarget?.title}</DialogDescription>
          </DialogHeader>

          {auditTarget && (
            <>
              <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Reported by</dt>
                  <dd className="font-medium">
                    {auditTarget.citizen?.fullName ?? "Anonymous"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Filed</dt>
                  <dd className="font-medium">
                    {formatDateTime(auditTarget.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Department</dt>
                  <dd className="font-medium">
                    {auditTarget.departmentName ?? "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Response SLA
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {SLA_BY_SEVERITY[auditTarget.severity] ?? "48h"}
                  </dd>
                </div>
              </dl>

              {auditTarget.description ? (
                <p className="text-sm text-muted-foreground">
                  {auditTarget.description}
                </p>
              ) : null}

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Status timeline</h4>
                {auditTarget.statusHistory?.length ? (
                  <ol className="space-y-3">
                    {[...auditTarget.statusHistory]
                      .reverse()
                      .map((entry, index) => (
                        <li
                          key={`${entry.createdAt}-${index}`}
                          className="flex gap-3"
                        >
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-sm font-medium">
                              {entry.status.replace(/_/g, " ").toLowerCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.changedBy} ·{" "}
                              {formatDateTime(entry.createdAt)}
                            </p>
                            {entry.note ? (
                              <p className="text-sm text-muted-foreground">
                                {entry.note}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No status changes recorded yet.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
