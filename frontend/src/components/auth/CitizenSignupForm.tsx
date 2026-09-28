"use client";

import {
  IconAlertCircle,
  IconArrowRight,
  IconLock,
  IconMail,
  IconMapPin,
  IconPhone,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { citizenSignup } from "@/lib/auth";

export default function CitizenSignupForm() {
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
          htmlFor="fullName"
          className="text-xs text-gray-300 font-medium"
        >
          Full name
        </FieldLabel>
        <div className="relative mt-1">
          <IconUser className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            id="fullName"
            required
            autoComplete="name"
            value={formData.fullName}
            onChange={(event) => update("fullName")(event.target.value)}
            placeholder="Tanvir Ahmed"
            className="pl-10 bg-[#090D17] border-[#233148] text-white placeholder-gray-500 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </Field>

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
            required
            autoComplete="email"
            value={formData.email}
            onChange={(event) => update("email")(event.target.value)}
            placeholder="tanvir@example.com"
            className="pl-10 bg-[#090D17] border-[#233148] text-white placeholder-gray-500 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </Field>

      <Field>
        <FieldLabel
          htmlFor="password"
          className="text-xs text-gray-300 font-medium"
        >
          Password
        </FieldLabel>
        <div className="relative mt-1">
          <IconLock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={formData.password}
            onChange={(event) => update("password")(event.target.value)}
            placeholder="At least 8 characters"
            className="pl-10 bg-[#090D17] border-[#233148] text-white placeholder-gray-500 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel
            htmlFor="phone"
            className="text-xs text-gray-300 font-medium"
          >
            Phone <span className="font-normal text-gray-500">(optional)</span>
          </FieldLabel>
          <div className="relative mt-1">
            <IconPhone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-500" />
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={(event) => update("phone")(event.target.value)}
              placeholder="+880 1700 000000"
              className="pl-10 bg-[#090D17] border-[#233148] text-white placeholder-gray-500 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </Field>

        <Field>
          <FieldLabel
            htmlFor="address"
            className="text-xs text-gray-300 font-medium"
          >
            Ward / Area{" "}
            <span className="font-normal text-gray-500">(optional)</span>
          </FieldLabel>
          <div className="relative mt-1">
            <IconMapPin className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-500" />
            <Input
              id="address"
              autoComplete="street-address"
              value={formData.address}
              onChange={(event) => update("address")(event.target.value)}
              placeholder="Ward 15, Dhanmondi"
              className="pl-10 bg-[#090D17] border-[#233148] text-white placeholder-gray-500 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </Field>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition gap-2 mt-2"
      >
        {loading ? <Spinner /> : null}
        <span>Create Account</span>
        <IconArrowRight className="size-4" />
      </Button>
    </form>
  );
}
