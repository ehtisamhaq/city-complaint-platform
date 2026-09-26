"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const styles = {
    LOW: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    MEDIUM:
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    HIGH: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium",
    CRITICAL:
      "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40 font-semibold animate-pulse",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border tracking-wide shadow-sm",
        styles[severity] || styles.MEDIUM,
        className,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          severity === "CRITICAL"
            ? "bg-red-500 animate-ping"
            : severity === "HIGH"
              ? "bg-amber-500"
              : severity === "MEDIUM"
                ? "bg-blue-500"
                : "bg-emerald-500",
        )}
      />
      {severity}
    </span>
  );
}

interface StatusBadgeProps {
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    PENDING:
      "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    ASSIGNED:
      "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    IN_PROGRESS:
      "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
    RESOLVED:
      "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 font-medium",
    CLOSED:
      "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  };

  const labels = {
    PENDING: "Pending Triage",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs border font-medium",
        styles[status] || styles.PENDING,
        className,
      )}
    >
      {labels[status] || status}
    </span>
  );
}
