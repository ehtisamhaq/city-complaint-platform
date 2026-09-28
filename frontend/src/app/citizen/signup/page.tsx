import { IconUserPlus } from "@tabler/icons-react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import CitizenSignupForm from "@/components/auth/CitizenSignupForm";

export const metadata = {
  title: "Create Account | CityPulse",
  description:
    "Create a free resident account to report issues and track municipal repairs.",
};

export default function CitizenSignupPage() {
  return (
    <AuthShell
      portalType="citizen"
      icon={<IconUserPlus className="size-7 text-amber-400" />}
      title="Create Resident Account"
      description="Report neighborhood issues, receive SMS/push updates, and confirm completed municipal repairs."
      footer={
        <p className="text-center text-xs text-gray-400">
          Already registered?{" "}
          <Link
            href="/citizen/login"
            className="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4"
          >
            Sign in to your account
          </Link>
        </p>
      }
    >
      <CitizenSignupForm />
    </AuthShell>
  );
}
