import { Compass } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="size-7" aria-hidden="true" />
      </div>

      <div className="max-w-md space-y-2">
        <p className="font-mono text-sm text-primary">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          No such page on the grid
        </h1>
        <p className="text-sm text-muted-foreground">
          The address you followed does not match a page in this platform. The
          public registry and the live map are a good place to pick the thread
          back up.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={buttonVariants()}>
          Public board
        </Link>
        <Link
          href="/complaints"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Browse complaints
        </Link>
      </div>
    </div>
  );
}
