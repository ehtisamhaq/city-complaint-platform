"use client";

import {
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconDroplet,
  IconInfoCircle,
  IconMapPin,
  IconRoad,
  IconTrafficLights,
  IconTrash,
  IconTrees,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { categoryLabel } from "@/components/Badges";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { citizenApi, type User } from "@/lib/api";
import { getClientUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full animate-pulse rounded-lg bg-muted" />
  ),
});

const categories = [
  {
    id: "ROADS",
    label: "Roads & asphalt",
    hint: "Potholes, cracks, kerbs",
    icon: IconRoad,
  },
  {
    id: "WATER",
    label: "Water & sewage",
    hint: "Leaks, mains, drain blockage",
    icon: IconDroplet,
  },
  {
    id: "LIGHTING",
    label: "Lighting & power",
    hint: "Dark streets, outages",
    icon: IconBolt,
  },
  {
    id: "WASTE",
    label: "Sanitation & waste",
    hint: "Illegal dumping, missed collections",
    icon: IconTrash,
  },
  {
    id: "PARKS",
    label: "Parks & trees",
    hint: "Fallen limbs, damaged turf",
    icon: IconTrees,
  },
  {
    id: "TRAFFIC",
    label: "Traffic & signals",
    hint: "Faulty lights, blocked signage",
    icon: IconTrafficLights,
  },
] as const;

const STEPS = ["What happened", "Where is it", "Review and submit"] as const;

export default function ReportHazardAiPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportWizard />
    </Suspense>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-8 w-72" />
        <Skeleton className="mt-3 h-4 w-96" />
        <Skeleton className="mt-6 h-2 w-full" />
        <Card className="mt-4">
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-5 w-24" />
            <div className="grid gap-2 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <Skeleton key={key} className="h-16 w-full" />
              ))}
            </div>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ReportWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilled = searchParams.get("description") ?? "";

  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState(prefilled ? prefilled.slice(0, 80) : "");
  const [description, setDescription] = useState(prefilled);
  const [category, setCategory] = useState<string>("ROADS");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.006);

  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setUser(getClientUser());
  }, []);

  const canContinue = step === 0 ? description.trim().length >= 10 : true;

  const goNext = () => {
    if (step === 0 && description.trim().length < 10) {
      setTitleError("Give at least a sentence so the city can route it.");
      return;
    }
    setTitleError(null);
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push("/citizen/login");
      return;
    }
    if (description.trim().length < 10) {
      setStep(0);
      setTitleError("Give at least a sentence so the city can route it.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await citizenApi.createComplaint({
        title: title.trim() || description.trim().slice(0, 80),
        description: description.trim(),
        category,
        locationName: locationName.trim() || undefined,
        latitude,
        longitude,
      });
      router.push("/citizen/dashboard?submitted=1");
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "The complaint could not be submitted. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 space-y-4">
          <div>
            <Badge variant="outline" className="mb-3">
              Service request
            </Badge>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Report a problem
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Three short steps. Severity is scored automatically and the
              request is routed to the responsible department.
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={step + 1} max={STEPS.length} />
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {STEPS.map((label, index) => (
                <li
                  key={label}
                  className={cn(
                    "flex items-center gap-2",
                    index <= step
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border text-[10px]",
                      index < step
                        ? "border-primary bg-primary text-primary-foreground"
                        : index === step
                          ? "border-primary text-primary"
                          : "border-border",
                    )}
                  >
                    {index < step ? (
                      <IconCheck className="size-3" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {label}
                  {index < STEPS.length - 1 ? (
                    <IconArrowRight className="size-3 opacity-40" />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {errorMsg ? (
          <Alert variant="destructive" className="mb-4">
            <IconInfoCircle className="size-4" />
            <AlertTitle>Submission failed</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        {!user ? (
          <Alert className="mb-4">
            <IconInfoCircle className="size-4" />
            <AlertTitle>Sign in to submit</AlertTitle>
            <AlertDescription>
              You need a citizen account to file a report so you can track it.
              Sign in first — your draft is kept on this page.
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardContent className="pt-6">
            {/* Step 1 — what happened */}
            {step === 0 ? (
              <div className="space-y-5">
                <Field>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <RadioGroup
                    value={category}
                    onValueChange={(value) => setCategory(value as string)}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {categories.map((item) => {
                      const Icon = item.icon;
                      const selected = category === item.id;
                      return (
                        <Label
                          key={item.id}
                          htmlFor={`category-${item.id}`}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                            "hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-accent",
                          )}
                        >
                          <RadioGroupItem
                            id={`category-${item.id}`}
                            value={item.id}
                            className="mt-0.5"
                          />
                          <Icon
                            className={cn(
                              "mt-0.5 size-4 shrink-0",
                              selected
                                ? "text-accent-foreground"
                                : "text-muted-foreground",
                            )}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">
                              {item.label}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {item.hint}
                            </span>
                          </span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">
                    What is happening?
                  </FieldLabel>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      if (titleError) setTitleError(null);
                    }}
                    rows={5}
                    maxLength={5000}
                    required
                    aria-invalid={Boolean(titleError)}
                    placeholder="Describe the problem, how big it is, and whether anyone is at risk."
                  />
                  <FieldError>{titleError}</FieldError>
                  <p className="text-xs text-muted-foreground">
                    {description.length}/5000 characters
                  </p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="title">
                    Short title{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FieldLabel>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={300}
                    placeholder="Deep pothole in the northbound lane"
                  />
                </Field>
              </div>
            ) : null}

            {/* Step 2 — where is it */}
            {step === 1 ? (
              <div className="space-y-5">
                <Field>
                  <FieldLabel htmlFor="location">
                    Closest street or landmark
                  </FieldLabel>
                  <Input
                    id="location"
                    value={locationName}
                    onChange={(event) => setLocationName(event.target.value)}
                    placeholder="442 Main Street, outside the pharmacy"
                  />
                </Field>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <IconMapPin className="size-4 text-muted-foreground" />
                    Pin the exact spot
                  </Label>
                  <MapboxMap
                    initialLat={latitude}
                    initialLng={longitude}
                    zoom={15}
                    onLocationSelect={(lat, lng, placeName) => {
                      setLatitude(lat);
                      setLongitude(lng);
                      if (placeName && !locationName)
                        setLocationName(placeName);
                    }}
                    className="h-[280px] w-full overflow-hidden rounded-lg border sm:h-[360px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Coordinates {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Step 3 — review */}
            {step === 2 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading text-lg font-semibold">
                    Check and submit
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This is what the city will publish on the transparency
                    board.
                  </p>
                </div>

                <dl className="divide-y rounded-lg border">
                  <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
                    <dt className="w-32 shrink-0 text-xs font-medium text-muted-foreground">
                      Category
                    </dt>
                    <dd className="text-sm">{categoryLabel(category)}</dd>
                  </div>
                  <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
                    <dt className="w-32 shrink-0 text-xs font-medium text-muted-foreground">
                      Title
                    </dt>
                    <dd className="text-sm">
                      {title.trim() || description.trim().slice(0, 80)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
                    <dt className="w-32 shrink-0 text-xs font-medium text-muted-foreground">
                      Description
                    </dt>
                    <dd className="text-sm whitespace-pre-line">
                      {description.trim()}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
                    <dt className="w-32 shrink-0 text-xs font-medium text-muted-foreground">
                      Location
                    </dt>
                    <dd className="text-sm">
                      {locationName.trim() || "No street reference"}
                      <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
                        {latitude.toFixed(4)}, {longitude.toFixed(4)}
                      </span>
                    </dd>
                  </div>
                </dl>

                <p className="text-xs text-muted-foreground">
                  Severity is scored from the description when you submit, so
                  the city can prioritise it alongside existing cases.
                </p>
              </div>
            ) : null}
          </CardContent>

          <div className="border-t p-4">
            <Separator className="sr-only" />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
                disabled={step === 0 || submitting}
                className="gap-2"
              >
                <IconArrowLeft className="size-4" />
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={goNext}
                  disabled={!canContinue}
                  className="gap-2"
                >
                  Continue
                  <IconArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Spinner />
                      Submitting
                    </>
                  ) : (
                    <>
                      Submit report
                      <IconCheck className="size-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {!user && step === STEPS.length - 1 ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                You will be asked to sign in before the report is sent.
              </p>
            ) : null}
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Reports are public.{" "}
          <Link
            href="/"
            className="font-medium text-foreground underline underline-offset-4"
          >
            See what others have reported
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
