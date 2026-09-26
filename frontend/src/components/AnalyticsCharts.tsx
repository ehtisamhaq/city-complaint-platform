"use client";

import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsChartsProps {
  byCategory: Record<string, number>;
  byDepartment: Array<{ name: string; total: number; resolved: number }>;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export default function AnalyticsCharts({
  byCategory,
  byDepartment,
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categoryData = Object.entries(byCategory || {}).map(
    ([name, value]) => ({
      name,
      count: value,
    }),
  );

  const departmentData = (byDepartment || []).map((d) => ({
    name: d.name,
    total: d.total,
    resolved: d.resolved,
    pending: d.total - d.resolved,
  }));

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm h-[300px] flex items-center justify-center text-xs text-muted-foreground">
          Loading charts...
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm h-[300px] flex items-center justify-center text-xs text-muted-foreground">
          Loading charts...
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Distribution Bar Chart */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            Complaints by Infrastructure Category
          </h3>
          <p className="text-xs text-muted-foreground">
            Volume breakdown across city service domains
          </p>
        </div>
        <div className="h-[240px] w-full min-w-0">
          {categoryData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No category data available yet
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <BarChart
                data={categoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                  stroke="#888888"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#888888" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Department Resolution Rate Pie */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            Department SLA Resolution
          </h3>
          <p className="text-xs text-muted-foreground">
            Resolved vs Pending cases by Department
          </p>
        </div>
        <div className="h-[240px] w-full min-w-0">
          {departmentData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No department resolution data available yet
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <PieChart>
                <Pie
                  data={departmentData}
                  dataKey="resolved"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({
                    name,
                    percent,
                  }: {
                    name?: string;
                    percent?: number;
                  }) =>
                    `${name || "Dept"} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {departmentData.map((_, index) => (
                    <Cell
                      key={`cell-dept-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
