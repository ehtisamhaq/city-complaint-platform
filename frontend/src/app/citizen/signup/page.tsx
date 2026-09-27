"use client";

import {
  IconAlertCircle,
  IconLock,
  IconMail,
  IconMapPin,
  IconPhone,
  IconUser,
  IconUserPlus,
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
import { citizenSignup } from "@/lib/auth";

export default function CitizenSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof formData) => (value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await citizenSignup(formData);
      router.push("/citizen/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The account could not be created",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      icon={<IconUserPlus className="size-6" />}
      title="Create your account"
      description="File service requests and follow every update until the fix is done."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            href="/citizen/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign in
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
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <div className="relative">
            <IconUser className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              required
              autoComplete="name"
              value={formData.fullName}
              onChange={(event) => update("fullName")(event.target.value)}
              placeholder="Alex Morgan"
              className="pl-9"
            />
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <div className="relative">
            <IconMail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(event) => update("email")(event.target.value)}
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
              required
              minLength={8}
              autoComplete="new-password"
              value={formData.password}
              onChange={(event) => update("password")(event.target.value)}
              placeholder="At least 8 characters"
              className="pl-9"
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="phone">
              Phone{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FieldLabel>
            <div className="relative">
              <IconPhone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(event) => update("phone")(event.target.value)}
                placeholder="+1 555 0100"
                className="pl-9"
              />
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="address">
              Address{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FieldLabel>
            <div className="relative">
              <IconMapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="address"
                autoComplete="street-address"
                value={formData.address}
                onChange={(event) => update("address")(event.target.value)}
                placeholder="442 Main Street"
                className="pl-9"
              />
            </div>
          </Field>
        </div>

        <Button type="submit" className="w-full gap-2" disabled={loading}>
          {loading ? <Spinner /> : null}
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
