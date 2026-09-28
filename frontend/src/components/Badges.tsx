"use client";

import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Status = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

/** Severity is a severity scale, styled with Nagar Civic high-contrast signals. */
const severityStyles: Record<
  Severity,
  { dot: string; chip: string; label: string }
> = {
  LOW: {
    dot: "bg-emerald-400",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    label: "Low Priority",
  },
  MEDIUM: {
    dot: "bg-sky-400",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    label: "Medium Priority",
  },
  HIGH: {
    dot: "bg-amber-400",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    label: "High Priority",
  },
  CRITICAL: {
    dot: "bg-red-400",
    chip: "border-red-500/30 bg-red-500/10 text-red-400",
    label: "Critical Alert",
  },
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const style = severityStyles[severity] ?? severityStyles.MEDIUM;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium tracking-wide text-xs", style.chip, className)}
    >
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0",
          style.dot,
          (severity === "CRITICAL" || severity === "HIGH") && "animate-pulse",
        )}
      />
      {style.label}
    </Badge>
  );
}

const statusStyles: Record<
  Status,
  { chip: string; label: string; dot: string }
> = {
  PENDING: {
    chip: "border-slate-700 bg-slate-800/80 text-gray-300",
    label: "Needs Review",
    dot: "bg-gray-400",
  },
  ASSIGNED: {
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    label: "Inspector Assigned",
    dot: "bg-sky-400",
  },
  IN_PROGRESS: {
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    label: "Crew Dispatched",
    dot: "bg-amber-400",
  },
  RESOLVED: {
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    label: "Fixed & Verified",
    dot: "bg-emerald-400",
  },
  CLOSED: {
    chip: "border-slate-800 bg-slate-900 text-slate-400",
    label: "Closed Dossier",
    dot: "bg-slate-500",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const style = statusStyles[status] ?? statusStyles.PENDING;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium tracking-wide text-xs", style.chip, className)}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", style.dot)} />
      {style.label}
    </Badge>
  );
}

/** Shared category vocabulary, so labels stay consistent across screens. */
export const categoryLabels: Record<string, string> = {
  ROADS: "Roads & Infrastructure",
  WATER: "Water & Sanitation",
  LIGHTING: "Lighting & Power",
  WASTE: "Sanitation & Waste",
  PARKS: "Parks & Greenery",
  TRAFFIC: "Traffic & Signals",
};

export const categoryShortLabels: Record<string, string> = {
  ROADS: "Roads",
  WATER: "Water",
  LIGHTING: "Lighting",
  WASTE: "Waste",
  PARKS: "Parks",
  TRAFFIC: "Traffic",
};

export function categoryLabel(category?: string | null): string {
  if (!category) return "General Civic";
  return categoryLabels[category] ?? category;
}

export function CategoryBadge({
  category,
  className,
  ...props
}: { category?: string | null } & ComponentProps<typeof Badge>) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium bg-slate-800/80 text-gray-200 border border-slate-700/60", className)}
      {...props}
    >
      {categoryLabel(category)}
    </Badge>
  );
}
