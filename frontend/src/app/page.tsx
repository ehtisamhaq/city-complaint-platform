import PublicBoard from "@/components/home/PublicBoard";
import Navbar from "@/components/Navbar";
import {
  getPublicComplaints,
  getPublicStatistics,
  getSnapshotTime,
} from "@/lib/server/data";

export const metadata = {
  title: "CityPulse | Report. Track. Transform.",
  description:
    "A unified civic transparency platform for reporting, tracking, and resolving urban infrastructure issues.",
};

const RECENT_PAGE_SIZE = 30;

export default async function HomePage() {
  // Both reads are cached and public, so awaiting them inline keeps this route
  // fully static and server-rendered. Wrapping them in <Suspense> instead makes
  // the whole board fall back to client-side rendering.
  const [stats, complaints, snapshotTime] = await Promise.all([
    getPublicStatistics(),
    getPublicComplaints({ page: 0, size: RECENT_PAGE_SIZE }),
    getSnapshotTime(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#0B1120] text-gray-100 selection:bg-amber-500 selection:text-black">
      <Navbar />
      <PublicBoard
        initialStats={stats}
        initialComplaints={complaints.content ?? []}
        snapshotTime={snapshotTime}
      />
    </div>
  );
}
