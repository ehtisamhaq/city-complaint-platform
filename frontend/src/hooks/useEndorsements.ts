"use client";

import { useCallback, useEffect, useState } from "react";
import { endorseComplaint } from "@/lib/actions/complaints";
import type { Complaint } from "@/lib/api/types";

/**
 * Endorsement state for the public board.
 *
 * The count is real: it comes from the backend on every complaint and is
 * maintained by POST /complaints/{id}/endorse. Only the "you already clicked
 * this" flag is kept client-side, in localStorage, because the endpoint is
 * anonymous by design and the server has no way to recognise a returning
 * visitor. That is scoped to the browser and is labelled as such in the UI.
 *
 * Endorsing is deliberately one-way. The backend only increments, so allowing
 * the button to be clicked back would either do nothing or require a decrement
 * endpoint that anonymous callers could use to zero out a count.
 */

const STORAGE_KEY = "citypulse:endorsed-complaints";

function readStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string")
      : [];
  } catch {
    // Private mode or a corrupted entry — treat as "endorsed nothing".
    return [];
  }
}

export function useEndorsements() {
  const [endorsed, setEndorsed] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  // Server-confirmed totals, which win over the copy on the list item.
  const [confirmed, setConfirmed] = useState<Record<string, number>>({});

  // Loaded after mount so the server-rendered markup and the first client
  // render agree; reading localStorage during render would mismatch.
  useEffect(() => {
    setEndorsed(new Set(readStored()));
  }, []);

  const countFor = useCallback(
    (complaint: Pick<Complaint, "id" | "endorseCount">) =>
      confirmed[complaint.id] ?? complaint.endorseCount ?? 0,
    [confirmed],
  );

  const endorse = useCallback(
    async (complaint: Pick<Complaint, "id" | "endorseCount">) => {
      if (endorsed.has(complaint.id) || pending.has(complaint.id)) return;

      const before = countFor(complaint);
      setPending((prev) => new Set(prev).add(complaint.id));
      setError(null);
      setConfirmed((prev) => ({ ...prev, [complaint.id]: before + 1 }));

      const result = await endorseComplaint(complaint.id);

      if (result.ok) {
        setConfirmed((prev) => ({
          ...prev,
          [complaint.id]: result.data.endorseCount,
        }));
        setEndorsed((prev) => {
          const next = new Set(prev).add(complaint.id);
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
          } catch {
            // Non-fatal: the count is already confirmed server-side.
          }
          return next;
        });
      } else {
        // Roll the optimistic bump back and tell the user why.
        setConfirmed((prev) => ({ ...prev, [complaint.id]: before }));
        setError(result.error);
      }

      setPending((prev) => {
        const next = new Set(prev);
        next.delete(complaint.id);
        return next;
      });
    },
    [countFor, endorsed, pending],
  );

  return { countFor, endorse, endorsed, pending, error };
}
