import { IconAlertTriangle } from "@tabler/icons-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardSkeleton from "@/components/common/DashboardSkeleton";
import Navbar from "@/components/Navbar";
import StaffQueue from "@/components/staff/StaffQueue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { User } from "@/lib/api";
import type {
  Complaint,
  PagedResponse,
  StaffDashboardData,
  StaffMember,
} from "@/lib/api/types";
import {
  getStaffComplaints,
  getStaffDashboard,
  getStaffMembers,
} from "@/lib/server/data";
import { getSession } from "@/lib/server/session";

export const metadata = {
  title: "Operations | CityPulse",
  description: "Triage, assign, and resolve city service requests.",
};

export default function StaffDashboardPage() {
  // The page itself does no dynamic work. The cookie read, the three backend
  // calls, and the role redirect all live below the Suspense boundary so the
  // shell prerenders and the queue streams in behind it.
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Suspense fallback={<DashboardSkeleton />}>
        <StaffQueueBody />
      </Suspense>
    </div>
  );
}

async function StaffQueueBody() {
  const session = await getSession();

  // proxy.ts classifies the token from its signed subject, so a citizen is
  // already turned away here. This is a second, server-side check on the role
  // claim that the unsigned user_info cookie carries.
  if (session?.user.role === "CITIZEN") {
    redirect("/citizen/dashboard");
  }

  return (
    <>
      <Navbar initialUser={session?.user} />
      {session ? (
        <Queue token={session.token} user={session.user} />
      ) : (
        <ExpiredSession />
      )}
    </>
  );
}

async function Queue({ token, user }: { token: string; user: User }) {
  let data: StaffDashboardData;
  let complaints: PagedResponse<Complaint>;
  let members: StaffMember[];
  try {
    [data, complaints, members] = await Promise.all([
      getStaffDashboard(token),
      getStaffComplaints(token),
      getStaffMembers(token),
    ]);
  } catch {
    return (
      <Main>
        <Alert variant="destructive">
          <IconAlertTriangle className="size-4" />
          <AlertTitle>Could not load the queue</AlertTitle>
          <AlertDescription>
            Could not reach the complaint service. Please try again shortly.
          </AlertDescription>
        </Alert>
      </Main>
    );
  }

  return (
    <StaffQueue
      user={user}
      initialData={data}
      initialComplaints={complaints.content ?? []}
      initialMembers={members}
    />
  );
}

function ExpiredSession() {
  return (
    <Main>
      <Alert variant="destructive">
        <IconAlertTriangle className="size-4" />
        <AlertTitle>Could not load the queue</AlertTitle>
        <AlertDescription>
          Your session has expired. Please sign in again.
        </AlertDescription>
      </Alert>
    </Main>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {children}
    </main>
  );
}
