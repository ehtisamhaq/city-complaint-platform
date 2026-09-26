// ─── Shared API envelope ───────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

// ─── Domain types ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "CITIZEN" | "ADMIN" | "TECHNICIAN";
  departmentName?: string;
  phone?: string;
  address?: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
  expiresInMs: number;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  severityScore?: number;
  objectType?: string;
  objectMeasurement?: string;
  aiSummary: string | null;
  suggestedCategory: string | null;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  citizen?: { id: string; fullName: string; email: string };
  assignedTo?: { id: string; fullName: string; email: string };
  departmentName?: string;
  statusHistory?: Array<{
    status: string;
    note: string;
    changedBy: string;
    createdAt: string;
  }>;
}

export interface CitizenDashboardData {
  stats: {
    totalComplaints: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
  recentComplaints: Complaint[];
}

export interface StaffDashboardData {
  stats: {
    totalAssigned: number;
    pending: number;
    inProgress: number;
    resolved: number;
    highPriorityCount: number;
  };
  assignedComplaints: Complaint[];
}

export interface PublicStatisticsData {
  stats: {
    totalComplaints: number;
    resolved: number;
    pending: number;
    inProgress: number;
  };
  byCategory: Record<string, number>;
  byDepartment: Array<{ name: string; total: number; resolved: number }>;
}

export interface RagResponseData {
  answer: string;
  sources: Array<{ title: string; category: string; excerpt: string }>;
  suggestedActions: string[];
  isComplaintContextIncluded: boolean;
}

export interface KnowledgeArticleData {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
