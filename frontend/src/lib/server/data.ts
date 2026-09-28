/**
 * Server-side data access.
 *
 * The public reads below are wrapped in `use cache` so every visitor shares
 * one backend round-trip instead of each one paying for their own. The
 * dashboard reads are deliberately NOT cached: they are per-user, and the
 * token has to be read from the request cookies at call time.
 *
 * This module must never be imported from a Client Component — it reads
 * `process.env` and uses `next/cache`. Client code keeps using `@/lib/api`.
 */

import { cacheLife, cacheTag } from "next/cache";
import type {
  CitizenDashboardData,
  Complaint,
  KnowledgeArticleData,
  PagedResponse,
  PublicStatisticsData,
  StaffDashboardData,
  StaffMember,
} from "@/lib/api/types";

/**
 * Absolute backend origin. The `/api/*` rewrite in next.config.ts only
 * applies to browser requests, so a server-side fetch has to address the
 * Spring Boot service directly.
 */
function backend(path: string): string {
  return `${process.env.BACKEND_URL ?? "http://localhost:8080"}${path}`;
}

/**
 * Unwraps the ApiResponse<T> envelope the backend returns on every route.
 * Throws on a non-2xx so callers can fall back to their error UI.
 */
async function read<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(backend(path), {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw new Error(`Backend responded ${response.status} for ${path}`);
  }

  const payload = (await response.json()) as { data?: T };
  return payload.data as T;
}

// ── Public: cached ─────────────────────────────────────────────────────────

/**
 * Platform-wide counters. Changes only when a complaint is filed or closed,
 * so a short life is plenty and every visitor reuses the same entry.
 */
export async function getPublicStatistics(): Promise<PublicStatisticsData> {
  "use cache";
  cacheLife("minutes");
  cacheTag("public-stats");

  return read<PublicStatisticsData>("/api/public/statistics");
}

export interface PublicComplaintQuery {
  status?: string;
  severity?: string;
  category?: string;
  page?: number;
  size?: number;
}

/**
 * Every parameter is a cache-key input, so each distinct filter combination
 * gets its own entry rather than one shared, wrong result.
 */
export async function getPublicComplaints({
  status,
  severity,
  category,
  page = 0,
  size = 20,
}: PublicComplaintQuery = {}): Promise<PagedResponse<Complaint>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("public-complaints");

  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (severity) query.set("severity", severity);
  if (category) query.set("category", category);
  query.set("page", String(page));
  query.set("size", String(size));

  return read<PagedResponse<Complaint>>(`/api/complaints?${query}`);
}

export async function getArticles(
  category?: string,
): Promise<KnowledgeArticleData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("knowledge-articles");

  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return read<KnowledgeArticleData[]>(`/api/rag/articles${query}`);
}

/**
 * The timestamp a cached snapshot was produced, for rendering "3h ago" style
 * labels.
 *
 * `Date.now()` is rejected while a static route is being prerendered — the
 * output would differ on every build and poison the cache. Reading the clock
 * inside `use cache` fixes the value to the lifetime of the snapshot, which is
 * exactly the semantics "3h ago" should have on a cached page.
 */
export async function getSnapshotTime(): Promise<number> {
  "use cache";
  cacheLife("minutes");

  return Date.now();
}

// ── Per-user: uncached, token passed in ─────────────────────────────────────
//
// The JWT is read from cookies by the caller and handed over as a plain
// argument, which keeps the dynamic cookie read outside any cached scope.

function authorized(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export function getCitizenDashboard(
  token: string,
): Promise<CitizenDashboardData> {
  return read<CitizenDashboardData>(
    "/api/dashboard/citizen",
    authorized(token),
  );
}

export function getStaffDashboard(token: string): Promise<StaffDashboardData> {
  return read<StaffDashboardData>("/api/dashboard/staff", authorized(token));
}

export function getStaffMembers(token: string): Promise<StaffMember[]> {
  return read<StaffMember[]>("/api/dashboard/staff/members", authorized(token));
}

export function getStaffComplaints(
  token: string,
  {
    status,
    severity,
    category,
    page = 0,
    size = 20,
  }: PublicComplaintQuery = {},
): Promise<PagedResponse<Complaint>> {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (severity) query.set("severity", severity);
  if (category) query.set("category", category);
  query.set("page", String(page));
  query.set("size", String(size));

  return read<PagedResponse<Complaint>>(
    `/api/complaints?${query}`,
    authorized(token),
  );
}
