"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { categoryShortLabels } from "@/components/Badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsChartsProps {
  byCategory: Record<string, number>;
  byDepartment: Array<{ name: string; total: number; resolved: number }>;
}

const categoryConfig = {
  complaints: { label: "Complaints", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

const departmentConfig = {
  resolved: { label: "Resolved", color: "var(--color-success)" },
  open: { label: "Still open", color: "var(--color-muted-foreground)" },
} satisfies ChartConfig;

export default function AnalyticsCharts({
  byCategory,
  byDepartment,
}: AnalyticsChartsProps) {
  const categoryData = Object.entries(byCategory ?? {})
    .map(([name, count]) => ({
      name: categoryShortLabels[name] ?? name,
      complaints: count,
    }))
    .sort((a, b) => b.complaints - a.complaints);

  const departmentData = (byDepartment ?? []).map((dept) => ({
    name: dept.name,
    resolved: dept.resolved,
    open: Math.max(dept.total - dept.resolved, 0),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Complaints by category</CardTitle>
          <CardDescription>
            Where residents are reporting issues most often
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyTitle>No category data yet</EmptyTitle>
                <EmptyDescription>
                  Charts appear once residents start filing reports.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ChartContainer
              config={categoryConfig}
              className="h-64 w-full"
              initialDimension={{ width: 480, height: 256 }}
            >
              <BarChart
                data={categoryData}
                margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="complaints"
                  fill="var(--color-complaints)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={64}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department resolution</CardTitle>
          <CardDescription>Resolved against still-open cases</CardDescription>
        </CardHeader>
        <CardContent>
          {departmentData.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyTitle>No department data yet</EmptyTitle>
                <EmptyDescription>
                  Resolution rates appear once cases are assigned.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ChartContainer
              config={departmentConfig}
              className="h-64 w-full"
              initialDimension={{ width: 480, height: 256 }}
            >
              <BarChart
                data={departmentData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={112}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="resolved"
                  stackId="cases"
                  fill="var(--color-resolved)"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="open"
                  stackId="cases"
                  fill="var(--color-open)"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[0, 1].map((key) => (
        <Card key={key}>
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
