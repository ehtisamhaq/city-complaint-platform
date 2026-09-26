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

interface ApiClientOptions extends ApiClientRequestOptions {
  method?: RequestMethod;
  body?: unknown;
  isFormData?: boolean;
  /** Internal flag — prevents infinite refresh loops on a retry */
  isRetry?: boolean;
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

    // Handle 401 Unauthorized - handled reactively by request() via silentRefresh
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
  private async silentRefresh(): Promise<
    "refreshed" | "overloaded" | "expired"
  > {
    if (typeof window === "undefined") return "expired";
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) return "refreshed";

      // 503 means the server is overloaded but the session may still be valid.
      if (res.status === 503) {
        try {
          const data = await res.json();
          if (data?.retryable) return "overloaded";
        } catch {
          // ignore JSON parse errors
        }
      }

      return "expired";
    } catch {
      // Network error — treat as overloaded so we don't log the user out
      // when it might just be a momentary connectivity blip.
      return "overloaded";
    }
  }

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
      isRetry = false,
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
          requestHeaders["Cookie"] = allCookies;
        }

        const token = cookieStore.get("jwt_token")?.value;
        if (token) {
          requestHeaders["Authorization"] = `Bearer ${token}`;
        }
      } catch {
        // cookies() not available (e.g., during build)
      }
    } else {
      const match = document.cookie.match(/(?:^|;\s*)jwt_token=([^;]*)/);
      if (match && match[1]) {
        requestHeaders["Authorization"] =
          `Bearer ${decodeURIComponent(match[1])}`;
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

      // On 401: attempt a silent token refresh then retry once
      if (
        response.status === 401 &&
        !isRetry &&
        typeof window !== "undefined"
      ) {
        clearTimeout(timeoutId);
        const refreshResult = await this.silentRefresh();

        if (refreshResult === "refreshed") {
          // Retry the original request with the fresh cookie
          return this.request<T>(endpoint, { ...options, isRetry: true });
        }

        if (refreshResult === "overloaded") {
          if (window.location.pathname !== "/overloaded") {
            window.location.href = "/overloaded";
          }
          return await this.handleResponse<T>(response);
        }

        // 'expired' — session is truly gone, redirect to login
        if (
          window.location.pathname !== "/citizen/login" &&
          !endpoint.includes("/auth/")
        ) {
          window.location.href = "/citizen/login";
        }

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

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && appUrl !== "/") return appUrl.replace(/\/$/, "");

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) return `https://${vercelProductionUrl}`;

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  if (process.env.NODE_ENV === "production") {
    console.error(
      "CRITICAL: NEXT_PUBLIC_APP_URL is missing in production runtime configuration!",
    );
  }

  return "http://localhost:3000";
};

export const api = new ApiClient(getBaseUrl());
export { ApiClient };
export type { ApiClientOptions, ApiClientRequestOptions };
