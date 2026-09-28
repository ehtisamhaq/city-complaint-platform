"use client";

import {
  IconAlertCircle,
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconSparkles,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { citizenLogin } from "@/lib/auth";

export default function CitizenLoginForm() {
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
      await citizenLogin(email, password);
      router.push("/citizen/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Invalid email or password. Please verify credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    setEmail("citizen@demo.com");
    setPassword("Password123");
    setError(null);
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
          htmlFor="email"
          className="text-xs text-gray-300 font-medium"
        >
          Email address
        </FieldLabel>
        <div className="relative mt-1">
          <IconMail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="pl-10 bg-[#090D17] border-[#233148] text-white placeholder-gray-500 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </Field>

      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel
            htmlFor="password"
            className="text-xs text-gray-300 font-medium"
          >
            Password
          </FieldLabel>
        </div>
        <div className="relative mt-1">
          <IconLock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
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
        <span>Sign In to Citizen Portal</span>
        <IconArrowRight className="size-4" />
      </Button>

      {/* Demo Account Box */}
      <div className="pt-4 border-t border-[#27354A]/60">
        <div className="flex items-center justify-between mb-2 text-[11px] text-gray-400">
          <span>Quick test credentials:</span>
          <span className="font-mono text-amber-400">Password123</span>
        </div>
        <button
          type="button"
          onClick={handleUseDemo}
          className="w-full py-2 px-3 rounded-xl border border-[#27354A] bg-[#090D17] hover:bg-[#162032] text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-center gap-2 transition"
        >
          <IconSparkles className="size-3.5 text-amber-400" />
          <span>Autofill Demo Citizen (John Citizen)</span>
        </button>
      </div>
    </form>
  );
}
