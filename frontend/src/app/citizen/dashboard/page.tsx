import { IconCircleCheck, IconClock } from "@tabler/icons-react";
import { Suspense } from "react";
import CitizenDashboard from "@/components/citizen/CitizenDashboard";
import DashboardSkeleton from "@/components/common/DashboardSkeleton";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CitizenDashboardData } from "@/lib/api";
import { getCitizenDashboard } from "@/lib/server/data";
import { getSession } from "@/lib/server/session";

export const metadata = {
  title: "My Requests | CityPulse",
  description: "Track every complaint you have reported and its progress.",
};

interface PageProps {
  searchParams: Promise<{ submitted?: string }>;
}

export default function CitizenDashboardPage({ searchParams }: PageProps) {
  // The page itself does no dynamic work. Cookies, search params, and the
  // per-user fetch all happen below the Suspense boundary so the shell still
  // prerenders and the dashboard streams in behind it.
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DashboardBody({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const justSubmitted = params.submitted === "1";
  const firstName = session?.user.fullName?.split(" ")[0] || "there";

  return (
    <>
      <Navbar initialUser={session?.user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {justSubmitted ? (
          <Alert className="mb-6">
            <IconCircleCheck className="size-4" />
            <AlertTitle>Report submitted</AlertTitle>
            <AlertDescription>
              The city has your request. Severity is being scored and it will be
              routed to the right department shortly.
            </AlertDescription>
          </Alert>
        ) : null}

        {session ? (
          <AuthenticatedDashboard token={session.token} firstName={firstName} />
        ) : (
          <Alert variant="destructive" className="mb-6">
            <IconClock className="size-4" />
            <AlertTitle>Could not load your requests</AlertTitle>
            <AlertDescription>
              Your session has expired. Please sign in again.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </>
  );
}

async function AuthenticatedDashboard({
  token,
  firstName,
}: {
  token: string;
  firstName: string;
}) {
  let data: CitizenDashboardData;
  try {
    data = await getCitizenDashboard(token);
  } catch {
    return (
      <Alert variant="destructive" className="mb-6">
        <IconClock className="size-4" />
        <AlertTitle>Could not load your requests</AlertTitle>
        <AlertDescription>
          Could not reach the complaint service
        </AlertDescription>
      </Alert>
    );
  }

  return <CitizenDashboard firstName={firstName} initialData={data} />;
}
