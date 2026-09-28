import { IconShieldCheck, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import CitizenLoginForm from "@/components/auth/CitizenLoginForm";

export const metadata = {
  title: "Citizen Sign In | CityPulse",
  description:
    "Sign in to track your municipal reports and audit resolution progress.",
};

export default function CitizenLoginPage() {
  return (
    <AuthShell
      portalType="citizen"
      icon={<IconUser className="size-7 text-amber-400" />}
      title="Citizen Resident Sign In"
      description="Track municipal reports, follow repair progress in your ward, and audit resolution proof."
      footer={
        <div className="space-y-3 text-center text-xs text-gray-400">
          <p>
            No account yet?{" "}
            <Link
              href="/citizen/signup"
              className="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4"
            >
              Create free resident account
            </Link>
          </p>
          <div className="pt-2 border-t border-[#27354A]/60 flex items-center justify-center gap-1.5 text-gray-400">
            <IconShieldCheck className="size-4 text-amber-500" />
            <span>City employee or technician?</span>
            <Link
              href="/staff/login"
              className="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4"
            >
              Staff Ops Portal →
            </Link>
          </div>
        </div>
      }
    >
      <CitizenLoginForm />
    </AuthShell>
  );
}
