"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Route-level error boundary.
 *
 * Lives in the root segment, so it catches a throw from any page while keeping
 * the root layout (and therefore the navbar) mounted. It only covers rendering
 * after the shell has flushed — a throw during the initial static prerender
 * still fails the build, which is the behaviour we want for the public pages.
 *
 * The most likely cause here is the backend being unreachable, since every
 * page now depends on it for its data.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route render failed:", error);
  }, [error]);

  const isBackendDown =
    /fetch failed|ECONNREFUSED|NetworkError|load failed/i.test(error.message);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {isBackendDown
            ? "Cannot reach the city services API"
            : "Something broke"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isBackendDown
            ? "The complaint service did not respond. This page pulls live data from it, so it cannot be shown right now."
            : "This page failed to render. You can retry, or head back to the public board."}
        </p>
      </div>

      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground/70">
          Reference: {error.digest}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to public board
        </Link>
      </div>
    </div>
  );
}
