"use client";

import {
  IconAlertCircle,
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { staffLogin } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  {
    label: "Administrator",
    role: "ADMIN",
    email: "admin@roads.gov",
    dept: "Roads & Highways",
  },
  {
    label: "Technician",
    role: "TECH",
    email: "tech@roads.gov",
    dept: "Roads & Highways",
  },
];

export default function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await staffLogin(email, password);
      router.push("/staff/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Invalid staff credentials or account disabled",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <Alert
          variant="destructive"
          className="bg-red-500/10 border-red-500/30 text-red-200"
        >
          <IconAlertCircle className="size-4 text-red-400" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      ) : null}

      <Field>
        <FieldLabel
          htmlFor="staff-email"
          className="text-xs text-gray-300 font-medium"
        >
          Official City Email
        </FieldLabel>
        <div className="relative mt-1">
          <IconMail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            id="staff-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="officer@roads.gov"
            className="pl-10 bg-[#090D17] border-[#233148] text-white placeholder-gray-500 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </Field>

      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel
            htmlFor="staff-password"
            className="text-xs text-gray-300 font-medium"
          >
            Security Password
          </FieldLabel>
        </div>
        <div className="relative mt-1">
          <IconLock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            id="staff-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="pl-10 pr-10 bg-[#090D17] border-[#233148] text-white placeholder-gray-500 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300"
            tabIndex={-1}
          >
            {showPassword ? (
              <IconEyeOff className="size-4" />
            ) : (
              <IconEye className="size-4" />
            )}
          </button>
        </div>
      </Field>

      <Button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition gap-2 mt-2"
      >
        {loading ? <Spinner /> : null}
        <span>Sign In to Ops Console</span>
        <IconArrowRight className="size-4" />
      </Button>

      {/* Demo Staff Accounts */}
      <div className="space-y-2 border-t border-[#27354A]/60 pt-4">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>Seeded municipal accounts:</span>
          <span className="font-mono text-amber-400">Password123</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword("Password123");
                setError(null);
              }}
              className="p-2.5 rounded-xl border border-[#27354A] bg-[#090D17] hover:bg-[#162032] text-left transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white group-hover:text-amber-400 transition">
                  {account.label}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {account.role}
                </span>
              </div>
              <span className="block text-[11px] text-gray-400 font-mono truncate mt-0.5">
                {account.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
