"use server";

/**
 * MUTATIONS, run on the server.
 *
 * Every write in this app goes through here rather than through `@/lib/api`
 * from the browser, for two reasons:
 *
 *  1. Cache coherence. The public pages are wrapped in `use cache` with
 *     `public-stats` / `public-complaints` / `knowledge-articles` tags. Nothing
 *     was ever calling `revalidateTag`, so a freshly filed report stayed
 *     invisible on the public board until the `minutes` TTL ran out. Each
 *     action below drops the tags it affects.
 *
 *  2. The token. The JWT is read from the request cookie here, so it never
 *     appears in a Server Action payload. If `jwt_token` is later moved to
 *     httpOnly — see the note in `@/lib/auth` — these actions keep working
 *     unchanged, whereas the client would lose its only way to authenticate.
 *
 * Errors come back as a value rather than a throw, because a thrown Server
 * Action surfaces to the user as a production-only redacted message, and the
 * form wants to show the backend's own text inline.
 */

import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";

import type { Complaint, KnowledgeArticleData } from "@/lib/api/types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function backend(path: string): string {
  return `${process.env.BACKEND_URL ?? "http://localhost:8080"}${path}`;
}

/** Mirrors the client error-unwrapping so both paths show the same text. */
function messageFrom(status: number, payload: unknown, text: string): string {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const field of ["error", "message", "errorMessage"] as const) {
      if (typeof obj[field] === "string") return obj[field] as string;
    }
  }
  if (text && !text.startsWith("<")) return text.slice(0, 200);
  return `Request failed with status ${status}`;
}

/**
 * Authenticated write against the backend. The 401/403 cases are reported
 * back to the caller rather than swallowed, so a form can tell the user their
 * session lapsed instead of showing a generic failure.
 */
async function write<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<ActionResult<T>> {
  const jar = await cookies();
  const token = jar.get("jwt_token")?.value;

  if (!token) {
    return {
      ok: false,
      error: "Your session has ended. Please sign in again.",
    };
  }

  let response: Response;
  try {
    response = await fetch(backend(path), {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      error: "The complaint service is unreachable. Please try again.",
    };
  }

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(text);
  } catch {
    // Non-JSON error page; messageFrom() falls back to the raw text.
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      error: "Your session has ended. Please sign in again.",
    };
  }

  if (!response.ok) {
    return { ok: false, error: messageFrom(response.status, payload, text) };
  }

  const envelope = payload as { data?: T };
  return { ok: true, data: envelope.data as T };
}

// ── Public cache invalidation ───────────────────────────────────────────────

/** A new complaint changes both the board and every counter on it. */
function invalidatePublicComplaintSurface() {
  updateTag("public-stats");
  updateTag("public-complaints");
  revalidatePath("/");
  revalidatePath("/complaints");
}

// ── Actions ─────────────────────────────────────────────────────────────────

export async function submitComplaint(input: {
  title: string;
  description: string;
  category: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
}): Promise<ActionResult<Complaint>> {
  const result = await write<Complaint>("/api/complaints", "POST", input);
  if (result.ok) invalidatePublicComplaintSurface();
  return result;
}

export async function changeComplaintStatus(
  id: string,
  body: { status: string; note?: string; includeAiReply?: boolean },
): Promise<ActionResult<{ complaint: Complaint; suggestedReply?: string }>> {
  const result = await write<{ complaint: Complaint; suggestedReply?: string }>(
    `/api/complaints/${id}/status`,
    "PATCH",
    body,
  );
  // Status and the AI triage reply both show up on the public board.
  if (result.ok) invalidatePublicComplaintSurface();
  return result;
}

export async function assignComplaint(
  id: string,
  staffId: string,
): Promise<ActionResult<Complaint>> {
  const result = await write<Complaint>(
    `/api/complaints/${id}/assign`,
    "PATCH",
    { assignedToId: staffId },
  );
  // The assigned-to name is rendered on the public board.
  if (result.ok) invalidatePublicComplaintSurface();
  return result;
}

export async function publishKnowledgeArticle(input: {
  title: string;
  category: string;
  content: string;
  tags?: string;
}): Promise<ActionResult<KnowledgeArticleData>> {
  const result = await write<KnowledgeArticleData>(
    "/api/rag/articles",
    "POST",
    input,
  );
  if (result.ok) {
    updateTag("knowledge-articles");
    revalidatePath("/rag");
  }
  return result;
}

// ── Public: endorsement ─────────────────────────────────────────────────────

/**
 * "Endorse this fix" from the public board.
 *
 * The only action here that is anonymous — the backend endpoint is permitAll,
 * matching the public surface it serves. It therefore bypasses `write()`, which
 * requires a token, and does not touch the `public-*` tags: a single click
 * moving one counter is not worth re-rendering the whole cached board for every
 * visitor. The response carries the new total, so the caller just adopts it.
 */
export async function endorseComplaint(
  id: string,
): Promise<ActionResult<{ endorseCount: number }>> {
  let response: Response;
  try {
    response = await fetch(backend(`/api/complaints/${id}/endorse`), {
      method: "POST",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      error: "The complaint service is unreachable. Please try again.",
    };
  }

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(text);
  } catch {
    // Non-JSON error body; messageFrom() falls back to the raw text.
  }

  if (!response.ok) {
    return { ok: false, error: messageFrom(response.status, payload, text) };
  }

  return {
    ok: true,
    data: (payload as { data: { endorseCount: number } }).data,
  };
}
