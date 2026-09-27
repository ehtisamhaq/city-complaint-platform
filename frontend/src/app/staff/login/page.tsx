"use client";

import {
  IconAlertCircle,
  IconLock,
  IconMail,
  IconShieldCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { staffLogin } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  { label: "Administrator", email: "admin@roads.gov" },
  { label: "Technician", email: "tech@roads.gov" },
];

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        caught instanceof Error ? caught.message : "Invalid staff credentials",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      icon={<IconShieldCheck className="size-6" />}
      title="Staff sign in"
      description="For city employees triaging and resolving service requests."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Resident instead?{" "}
          <Link
            href="/citizen/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Use the citizen portal
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <IconAlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="staff-email">City email</FieldLabel>
          <div className="relative">
            <IconMail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="staff-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@city.gov"
              className="pl-9"
            />
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="staff-password">Password</FieldLabel>
          <div className="relative">
            <IconLock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="staff-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="pl-9"
            />
          </div>
        </Field>

        <Button type="submit" className="w-full gap-2" disabled={loading}>
          {loading ? <Spinner /> : null}
          Sign in to the ops console
        </Button>

        <div className="space-y-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Demo staff accounts — password{" "}
            <code className="font-mono">Password123</code>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail(account.email);
                  setPassword("Password123");
                }}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </div>
      </form>
    </AuthShell>
  );
}
