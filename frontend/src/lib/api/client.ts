/**
 * Centralized API Client
 * Handles auth, errors, redirects, and both JSON and FormData requests
 */

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}

interface ApiClientRequestOptions {
  headers?: Record<string, string>;
  next?: NextFetchRequestConfig;
  cache?: RequestCache;
  timeout?: number;
}

/** Adds the request body fields on top of the shared per-request options. */
interface ApiClientOptions extends ApiClientRequestOptions {
  method?: RequestMethod;
  body?: unknown;
  isFormData?: boolean;
}

import type { ApiResponse } from "@/lib/api/types";
import { ApiError } from "./api-error";

const DEFAULT_TIMEOUT = 30000; // 30 seconds

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Extract error message from various response formats
   */
  private extractErrorMessage(data: unknown, text: string): string | null {
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;

      // Check common error fields
      if (typeof obj.error === "string") return obj.error;
      if (typeof obj.message === "string") return obj.message;
      if (typeof obj.errorMessage === "string") return obj.errorMessage;

      // Handle array of errors
      if (Array.isArray(obj.errors) && obj.errors.length > 0) {
        const firstError = obj.errors[0];
        if (typeof firstError === "string") return firstError;
        if (typeof firstError?.message === "string") return firstError.message;
      }
    }

    // Use raw text if not HTML
    if (text && !text.startsWith("<!DOCTYPE") && !text.startsWith("<html")) {
      return text.slice(0, 200);
    }

    return null;
  }

  /**
   * Routes that require a live session. A 403 on one of these means the
   * stored token is expired or rejected, not that the caller lacked a role
   * for the action, so the session is dropped and re-auth prompted.
   */
  private static readonly PROTECTED_PREFIXES = [
    "/citizen/dashboard",
    "/staff/dashboard",
  ];

  /**
   * Drop the stale session and send the user to the login page that matches
   * where they were. The backend answers 403 (not 401) for an anonymous
   * request to a role-protected endpoint, so without this a stale token
   * strands the user on a permanently broken dashboard.
   *
   * Returns true when it handled the recovery.
   */
  private handleSessionExpiry(endpoint: string): boolean {
    if (typeof window === "undefined") return false;
    if (endpoint.includes("/auth/")) return false;

    const { pathname } = window.location;
    if (
      !ApiClient.PROTECTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix),
      )
    ) {
      return false;
    }

    const loginPath = pathname.startsWith("/staff/")
      ? "/staff/login"
      : "/citizen/login";
    if (pathname.startsWith(loginPath)) return false;

    // Lazy import avoids a cycle: auth.ts imports from @/lib/api.
    void import("@/lib/auth").then(({ clearAuthCookies }) => {
      clearAuthCookies();
      window.location.href = loginPath;
    });
    return true;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: unknown = null;
    let text = "";

    try {
      text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch {
      // Failed to parse JSON, data remains null
    }

    // 401 → the caller decides how to recover; the dashboards show a
    // "session expired" notice, and clearAuthCookies() runs on logout.
    if (response.status === 401) {
      const errorMsg = this.extractErrorMessage(data, text);
      throw new ApiError(
        401,
        errorMsg || "Session expired. Please login again.",
      );
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      const errorMsg =
        this.extractErrorMessage(data, text) ||
        "You do not have permission to perform this action.";
      throw new ApiError(403, errorMsg);
    }

    if (!response.ok) {
      const errorMsg = this.extractErrorMessage(data, text) || "API Error";
      throw new ApiError(response.status, errorMsg);
    }

    return data as ApiResponse<T>;
  }

  /**
   * Attempts a silent token refresh via POST /api/auth/refresh.
   * Only runs in the browser.
   * Returns:
   *   'refreshed'  — new token set, original request can be retried
   *   'overloaded' — server is temporarily under load, redirect to /overloaded
   *   'expired'    — session is gone, redirect to /login
   */

  async request<T = unknown>(
    endpoint: string,
    options: ApiClientOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      body,
      headers = {},
      isFormData = false,
      next,
      cache,
      timeout = DEFAULT_TIMEOUT,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;

    // Don't set Content-Type for FormData - browser will set it with boundary
    const requestHeaders: Record<string, string> = isFormData
      ? { ...headers }
      : { "Content-Type": "application/json", ...headers };

    // Auto-forward cookies on server-side (for server components)
    if (typeof window === "undefined") {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();

        // Forward the entire raw cookie string intact
        const allCookies = cookieStore.toString();
        if (allCookies) {
          requestHeaders.Cookie = allCookies;
        }

        const token = cookieStore.get("jwt_token")?.value;
        if (token) {
          requestHeaders.Authorization = `Bearer ${token}`;
        }
      } catch {
        // cookies() not available (e.g., during build)
      }
    } else {
      const match = document.cookie.match(/(?:^|;\s*)jwt_token=([^;]*)/);
      if (match?.[1]) {
        requestHeaders.Authorization = `Bearer ${decodeURIComponent(match[1])}`;
      }
    }

    const fetchOptions: RequestInit & { next?: NextFetchRequestConfig } = {
      method,
      headers: requestHeaders,
      credentials: "include",
      next,
      cache,
    };

    if (body && method !== "GET") {
      fetchOptions.body =
        isFormData && body instanceof FormData ? body : JSON.stringify(body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    fetchOptions.signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, fetchOptions);

      // 401 = no valid session. 403 = authenticated but wrong role. The
      // backend keeps these distinct (RestAuthenticationEntryPoint /
      // RestAccessDeniedHandler), so either one means the locally stored
      // credentials no longer describe this user and must be re-established.
      if (
        (response.status === 401 || response.status === 403) &&
        this.handleSessionExpiry(endpoint)
      ) {
        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response);
      }

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      console.error("API request failed:", error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── HTTP verb shortcuts ─────────────────────────────────────────────────

  get<T = unknown>(endpoint: string, options?: ApiClientRequestOptions) {
    return this.request<T>(endpoint, { method: "GET", ...options });
  }

  post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiClientRequestOptions,
  ) {
    return this.request<T>(endpoint, { method: "POST", body, ...options });
  }

  put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiClientRequestOptions,
  ) {
    return this.request<T>(endpoint, { method: "PUT", body, ...options });
  }

  patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiClientRequestOptions,
  ) {
    return this.request<T>(endpoint, { method: "PATCH", body, ...options });
  }

  delete<T = unknown>(endpoint: string, options?: ApiClientRequestOptions) {
    return this.request<T>(endpoint, { method: "DELETE", ...options });
  }

  // ── FormData shortcuts (file uploads) ──────────────────────────────────

  postForm<T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: ApiClientRequestOptions,
  ) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      isFormData: true,
      ...options,
    });
  }

  patchForm<T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: ApiClientRequestOptions,
  ) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: formData,
      isFormData: true,
      ...options,
    });
  }

  putForm<T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: ApiClientRequestOptions,
  ) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: formData,
      isFormData: true,
      ...options,
    });
  }
}

// ── Base URL resolution ────────────────────────────────────────────────────

/**
 * Shared by the client components and by the server components' sibling data
 * layer. Browser calls are same-origin and proxied to Spring Boot by the
 * rewrite in next.config.ts; server components instead call the backend
 * directly through `lib/server/data.ts` and never construct this client. An
 * empty base keeps the URL relative; there is no public app URL to configure.
 */
const getBaseUrl = () => "";

export const api = new ApiClient(getBaseUrl());
export { ApiClient };
export type { ApiClientOptions, ApiClientRequestOptions };
