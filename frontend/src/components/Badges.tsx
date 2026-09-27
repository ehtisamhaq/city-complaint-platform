"use client";

import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Status = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

/** Severity is a severity scale, so it maps onto the theme's signal tokens. */
const severityStyles: Record<
  Severity,
  { dot: string; chip: string; label: string }
> = {
  LOW: {
    dot: "bg-success",
    chip: "border-success/30 bg-success/10 text-success",
    label: "Low",
  },
  MEDIUM: {
    dot: "bg-chart-1",
    chip: "border-chart-1/30 bg-chart-1/10 text-chart-1",
    label: "Medium",
  },
  HIGH: {
    dot: "bg-warning",
    chip: "border-warning/30 bg-warning/10 text-warning",
    label: "High",
  },
  CRITICAL: {
    dot: "bg-destructive",
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    label: "Critical",
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
      className={cn("gap-1.5 font-medium", style.chip, className)}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          style.dot,
          severity === "CRITICAL" && "animate-pulse",
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
    chip: "border-muted-foreground/25 bg-muted text-muted-foreground",
    label: "Needs review",
    dot: "bg-muted-foreground",
  },
  ASSIGNED: {
    chip: "border-accent-foreground/25 bg-accent text-accent-foreground",
    label: "Assigned",
    dot: "bg-accent-foreground",
  },
  IN_PROGRESS: {
    chip: "border-primary/25 bg-primary/10 text-primary",
    label: "In progress",
    dot: "bg-primary",
  },
  RESOLVED: {
    chip: "border-success/30 bg-success/10 text-success",
    label: "Resolved",
    dot: "bg-success",
  },
  CLOSED: {
    chip: "border-border bg-muted text-muted-foreground",
    label: "Closed",
    dot: "bg-muted-foreground",
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
      className={cn("font-medium", style.chip, className)}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </Badge>
  );
}

/** Shared category vocabulary, so labels stay consistent across screens. */
export const categoryLabels: Record<string, string> = {
  ROADS: "Roads & infrastructure",
  WATER: "Water & sanitation",
  LIGHTING: "Lighting & power",
  WASTE: "Sanitation & waste",
  PARKS: "Parks & trees",
  TRAFFIC: "Traffic & signals",
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
  if (!category) return "Uncategorised";
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
      className={cn("font-normal", className)}
      {...props}
    >
      {categoryLabel(category)}
    </Badge>
  );
}
