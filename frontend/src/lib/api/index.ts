/**
 * @/lib/api — public barrel
 *
 * Import from here everywhere in the app:
 *   import { api } from '@/lib/api'
 *   import type { Complaint, User } from '@/lib/api'
 */

export { ApiError } from "./api-error";
export type { ApiClientOptions, ApiClientRequestOptions } from "./client";
export { ApiClient, api } from "./client";
export type {
  ApiResponse,
  AuthResponseData,
  CitizenDashboardData,
  Complaint,
  KnowledgeArticleData,
  PagedResponse,
  PublicStatisticsData,
  RagResponseData,
  StaffDashboardData,
  StaffMember,
  User,
} from "./types";

// ── Domain-scoped helpers ──────────────────────────────────────────────────
// Re-export so callers never import directly from sub-modules.

import { api } from "./client";
import type {
  AuthResponseData,
  CitizenDashboardData,
  Complaint,
  KnowledgeArticleData,
  PagedResponse,
  PublicStatisticsData,
  RagResponseData,
  StaffDashboardData,
  StaffMember,
} from "./types";

// ── Public ─────────────────────────────────────────────────────────────────

export const publicApi = {
  getStats: () =>
    api.get<PublicStatisticsData>("/api/public/statistics", {
      cache: "no-store",
    }),

  getComplaints: (params?: {
    status?: string;
    severity?: string;
    category?: string;
    page?: number;
    size?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.severity) q.set("severity", params.severity);
    if (params?.category) q.set("category", params.category);
    q.set("page", String(params?.page ?? 0));
    q.set("size", String(params?.size ?? 20));
    return api.get<PagedResponse<Complaint>>(`/api/complaints?${q}`, {
      cache: "no-store",
    });
  },
};

// ── Auth (proxied via Route Handler → sets cookies) ───────────────────────

export const authApi = {
  citizenLogin: (body: { email: string; password: string }) =>
    api.post<AuthResponseData>("/api/auth/citizen/login", body),
  citizenSignup: (body: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => api.post<AuthResponseData>("/api/auth/citizen/signup", body),
  staffLogin: (body: { email: string; password: string }) =>
    api.post<AuthResponseData>("/api/auth/staff/login", body),
  logout: () => api.post("/api/auth/logout"),
};

// ── Citizen ────────────────────────────────────────────────────────────────

export const citizenApi = {
  getDashboard: () =>
    api.get<CitizenDashboardData>("/api/dashboard/citizen", {
      cache: "no-store",
    }),

  getMyComplaints: (page = 0, size = 10) =>
    api.get<PagedResponse<Complaint>>(
      `/api/complaints/my?page=${page}&size=${size}`,
      { cache: "no-store" },
    ),

  getComplaint: (id: string) =>
    api.get<Complaint>(`/api/complaints/${id}`, { cache: "no-store" }),

  createComplaint: (body: {
    title: string;
    description: string;
    category: string;
    locationName?: string;
    latitude?: number | null;
    longitude?: number | null;
    photoUrl?: string;
  }) => api.post<Complaint>("/api/complaints", body),

  submitFeedback: (
    complaintId: string,
    body: { rating: number; comment?: string },
  ) => api.post(`/api/feedback/${complaintId}`, body),
};

// ── Staff ──────────────────────────────────────────────────────────────────

export const staffApi = {
  getDashboard: () =>
    api.get<StaffDashboardData>("/api/dashboard/staff", { cache: "no-store" }),

  getAllComplaints: (params?: {
    status?: string;
    severity?: string;
    category?: string;
    page?: number;
    size?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.severity) q.set("severity", params.severity);
    if (params?.category) q.set("category", params.category);
    q.set("page", String(params?.page ?? 0));
    q.set("size", String(params?.size ?? 20));
    return api.get<PagedResponse<Complaint>>(`/api/complaints?${q}`, {
      cache: "no-store",
    });
  },

  updateStatus: (
    id: string,
    body: { status: string; note?: string; includeAiReply?: boolean },
  ) =>
    api.patch<{ complaint: Complaint; suggestedReply?: string }>(
      `/api/complaints/${id}/status`,
      body,
    ),

  assign: (id: string, staffId: string) =>
    api.patch<Complaint>(`/api/complaints/${id}/assign`, {
      assignedToId: staffId,
    }),

  getMembers: () =>
    api.get<StaffMember[]>("/api/dashboard/staff/members", {
      cache: "no-store",
    }),
};

// ── RAG ────────────────────────────────────────────────────────────────────

export const ragApi = {
  ask: (question: string, complaintId?: string) =>
    api.post<RagResponseData>("/api/rag/ask", { question, complaintId }),

  getArticles: (category?: string) =>
    api.get<KnowledgeArticleData[]>(
      category
        ? `/api/rag/articles?category=${encodeURIComponent(category)}`
        : "/api/rag/articles",
      { cache: "no-store" },
    ),

  createArticle: (body: {
    title: string;
    category: string;
    content: string;
    tags?: string;
  }) => api.post<KnowledgeArticleData>("/api/rag/articles", body),
};

