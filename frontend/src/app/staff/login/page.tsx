import { IconShieldCheck } from "@tabler/icons-react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import StaffLoginForm from "@/components/auth/StaffLoginForm";

export const metadata = {
  title: "Staff Ops Console | CityPulse",
  description:
    "Authorized municipal personnel access for triage officers and ward technicians.",
};

export default function StaffLoginPage() {
  return (
    <AuthShell
      portalType="staff"
      icon={<IconShieldCheck className="size-7 text-amber-400" />}
      title="Municipal Ops Command"
      description="Authorized personnel access for triage officers, ward technicians, and department directors."
      footer={
        <div className="space-y-3 text-center text-xs text-gray-400">
          <p>
            Looking to file or follow a neighborhood report?{" "}
            <Link
              href="/citizen/login"
              className="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4"
            >
              Use the resident portal →
            </Link>
          </p>
        </div>
      }
    >
      <StaffLoginForm />
    </AuthShell>
  );
}
