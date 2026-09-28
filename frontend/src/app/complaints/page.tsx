import { Suspense } from "react";
import ComplaintsRegistry from "@/components/complaints/ComplaintsRegistry";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPublicComplaints,
  getPublicStatistics,
  getSnapshotTime,
} from "@/lib/server/data";

export const metadata = {
  title: "Complaint Registry | CityPulse",
  description:
    "Browse every geotagged municipal complaint, its severity, department, and verified repair status.",
};

const REGISTRY_PAGE_SIZE = 100;

interface PageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    severity?: string;
    id?: string;
  }>;
}

export default function ComplaintsRegistryPage({ searchParams }: PageProps) {
  // The data behind this route is public and cached, so every visitor reuses
  // the same two backend responses. Only the filter params differ per URL, and
  // they are applied on the client without a refetch.
  return (
    <div className="min-h-dvh flex flex-col bg-[#0B1120] text-gray-100">
      <Navbar />
      <Suspense fallback={<RegistrySkeleton />}>
        <RegistryBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RegistryBody({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  const params = await searchParams;

  const [stats, complaintsPage, snapshotTime] = await Promise.all([
    getPublicStatistics(),
    getPublicComplaints({ page: 0, size: REGISTRY_PAGE_SIZE }),
    getSnapshotTime(),
  ]);

  return (
    <ComplaintsRegistry
      initialStats={stats}
      initialComplaints={complaintsPage.content ?? []}
      initialCategory={params.category || "ALL"}
      initialStatus={params.status || "ALL"}
      initialSeverity={params.severity || "ALL"}
      highlightId={params.id ?? null}
      snapshotTime={snapshotTime}
    />
  );
}

function RegistrySkeleton() {
  return (
    <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
      <Skeleton className="h-10 w-64 bg-slate-800" />
      <Skeleton className="mt-3 h-5 w-96 bg-slate-800" />
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full bg-slate-800 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-8 h-12 w-full bg-slate-800 rounded-xl" />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-64 w-full bg-slate-800 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
