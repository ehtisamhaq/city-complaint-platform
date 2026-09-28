import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streaming placeholder for the two authenticated dashboards.
 *
 * Both pages read cookies and then fetch per-user data from the backend, so
 * they are partial-prerendered and stream this in first. Without it the user
 * gets a blank screen for the length of the round trip.
 */
export default function DashboardSkeleton() {
  const statTiles = ["one", "two", "three", "four"];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statTiles.map((tile) => (
          <Skeleton key={tile} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
