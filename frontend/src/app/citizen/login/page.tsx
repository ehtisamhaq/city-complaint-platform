"use client";

import {
  IconAlertCircle,
  IconLock,
  IconMail,
  IconUser,
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
import { citizenLogin } from "@/lib/auth";

export default function CitizenLoginPage() {
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
      await citizenLogin(email, password);
      router.push("/citizen/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Invalid email or password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      icon={<IconUser className="size-6" />}
      title="Sign in to your account"
      description="Track your reports, follow progress, and leave feedback on fixes."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <Link
            href="/citizen/signup"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Create one
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
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <div className="relative">
            <IconMail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="pl-9"
            />
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <IconLock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="pl-9"
            />
          </div>
        </Field>

        <Button type="submit" className="w-full gap-2" disabled={loading}>
          {loading ? <Spinner /> : null}
          Sign in
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setEmail("citizen@demo.com");
            setPassword("Password123");
          }}
        >
          Use the demo resident account
        </Button>
      </form>
    </AuthShell>
  );
}
