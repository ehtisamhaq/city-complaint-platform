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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { categoryLabel } from "@/components/Badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { submitComplaint } from "@/lib/actions/complaints";
import type { User } from "@/lib/api";
import { getClientUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const MapboxMap = dynamic(() => import("@/components/MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full animate-pulse rounded-xl bg-white/5 border border-white/10" />
  ),
});

const categories = [
  {
    id: "ROADS",
    label: "Roads & asphalt",
    hint: "Potholes, cracks, kerbs",
    icon: IconRoad,
    color: "text-orange-400",
  },
  {
    id: "WATER",
    label: "Water & sewage",
    hint: "Leaks, mains, drain blockage",
    icon: IconDroplet,
    color: "text-blue-400",
  },
  {
    id: "LIGHTING",
    label: "Lighting & power",
    hint: "Dark streets, outages",
    icon: IconBolt,
    color: "text-yellow-400",
  },
  {
    id: "WASTE",
    label: "Sanitation & waste",
    hint: "Illegal dumping, missed collections",
    icon: IconTrash,
    color: "text-red-400",
  },
  {
    id: "PARKS",
    label: "Parks & trees",
    hint: "Fallen limbs, damaged turf",
    icon: IconTrees,
    color: "text-green-400",
  },
  {
    id: "TRAFFIC",
    label: "Traffic & signals",
    hint: "Faulty lights, blocked signage",
    icon: IconTrafficLights,
    color: "text-purple-400",
  },
] as const;

const STEPS = ["What happened", "Where is it", "Review & submit"] as const;

// ── Zod Validation Schemas ─────────────────────────────────────────────────

const step0Schema = z.object({
  category: z.enum(
    ["ROADS", "WATER", "LIGHTING", "WASTE", "PARKS", "TRAFFIC"],
    { message: "Please select a valid hazard category" },
  ),
  description: z
    .string()
    .trim()
    .min(10, "Please describe what is happening in at least 10 characters.")
    .max(5000, "Description cannot exceed 5000 characters"),
  title: z
    .string()
    .trim()
    .max(300, "Title cannot exceed 300 characters")
    .optional(),
});

const step1Schema = z.object({
  locationName: z
    .string()
    .trim()
    .max(300, "Location reference cannot exceed 300 characters")
    .optional(),
  latitude: z.number().min(-90).max(90, "Invalid latitude value"),
  longitude: z.number().min(-180).max(180, "Invalid longitude value"),
});

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialLocationName?: string;
  onSuccess?: () => void;
}

export default function ReportModal({
  isOpen,
  onClose,
  initialCategory,
  initialLocationName,
  onSuccess,
}: ReportModalProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(initialCategory || "ROADS");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState(23.8103);
  const [longitude, setLongitude] = useState(90.4125);

  // Field validation errors
  const [descError, setDescError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUser(getClientUser());
      if (initialCategory) setCategory(initialCategory);
      if (initialLocationName) setLocationName(initialLocationName);
    }
  }, [isOpen, initialCategory, initialLocationName]);

  // Validation before advancing step
  const validateStep0 = () => {
    setDescError(null);
    setCategoryError(null);

    const result = step0Schema.safeParse({ category, description, title });
    if (!result.success) {
      const formatted = result.error.format();
      if (formatted.category?._errors[0]) {
        setCategoryError(formatted.category._errors[0]);
      }
      if (formatted.description?._errors[0]) {
        setDescError(formatted.description._errors[0]);
      }
      return false;
    }
    return true;
  };

  const validateStep1 = () => {
    setLocationError(null);
    const result = step1Schema.safeParse({ locationName, latitude, longitude });
    if (!result.success) {
      const formatted = result.error.format();
      if (formatted.locationName?._errors[0]) {
        setLocationError(formatted.locationName._errors[0]);
      }
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 0) {
      if (!validateStep0()) return;
    } else if (step === 1) {
      if (!validateStep1()) return;
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      onClose();
      router.push("/citizen/login");
      return;
    }

    if (!validateStep0() || !validateStep1()) {
      setStep(0);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await submitComplaint({
        title: title.trim() || description.trim().slice(0, 80),
        description: description.trim(),
        category,
        locationName: locationName.trim() || undefined,
        latitude,
        longitude,
      });

      if (!result.ok) {
        setErrorMsg(result.error);
        setSubmitting(false);
        return;
      }

      // Reset and close
      setSubmitting(false);
      handleReset();
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/citizen/dashboard?submitted=1");
      }
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "The complaint could not be submitted. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setTitle("");
    setDescription("");
    setLocationName("");
    setDescError(null);
    setCategoryError(null);
    setLocationError(null);
    setErrorMsg(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleReset();
      onClose();
    }
  };

  // Fixed progress bar percentage calculation:
  // Step 0: 33%, Step 1: 67%, Step 2: 100%
  const progressPercent = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl border-white/10 bg-[#0B1120]">
        {/* Header with Progress Bar */}
        <DialogHeader className="border-b border-white/10 p-5 bg-[#111827]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-400"
              >
                Service Request
              </Badge>
              <span className="text-xs text-gray-400 font-mono">
                Step {step + 1} of {STEPS.length} ({progressPercent}%)
              </span>
            </div>
            <DialogTitle className="text-xl text-white font-heading font-bold">
              {STEPS[step]}
            </DialogTitle>

            {/* Fixed Progress Component */}
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <ScrollArea className="flex-1 p-5 min-h-[350px]">
          {errorMsg ? (
            <Alert
              variant="destructive"
              className="mb-4 border-red-500/30 bg-red-500/10"
            >
              <IconInfoCircle className="size-4 text-red-400" />
              <AlertTitle className="text-red-300">
                Submission failed
              </AlertTitle>
              <AlertDescription className="text-red-400">
                {errorMsg}
              </AlertDescription>
            </Alert>
          ) : null}

          {!user ? (
            <Alert className="mb-4 border-amber-500/30 bg-amber-500/10">
              <IconInfoCircle className="size-4 text-amber-400" />
              <AlertTitle className="text-amber-300">
                Sign in required
              </AlertTitle>
              <AlertDescription className="text-amber-400/80">
                You will be prompted to sign in to submit and track your report.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Step 0 — category, description, title */}
          {step === 0 ? (
            <div className="space-y-5">
              <Field>
                <FieldLabel className="text-sm font-medium text-gray-200">
                  Select Category *
                </FieldLabel>
                <RadioGroup
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value as string);
                    if (categoryError) setCategoryError(null);
                  }}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {categories.map((item) => {
                    const Icon = item.icon;
                    const selected = category === item.id;
                    return (
                      <Label
                        key={item.id}
                        htmlFor={`cat-${item.id}`}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all",
                          selected
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20",
                        )}
                      >
                        <RadioGroupItem
                          id={`cat-${item.id}`}
                          value={item.id}
                          className="mt-0.5 border-white/30"
                        />
                        <Icon
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            selected ? item.color : "text-gray-400",
                          )}
                        />
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block text-xs font-medium",
                              selected ? "text-white" : "text-gray-200",
                            )}
                          >
                            {item.label}
                          </span>
                          <span className="block text-[11px] text-gray-500">
                            {item.hint}
                          </span>
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
                {categoryError ? (
                  <FieldError>{categoryError}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="desc-input"
                  className="text-sm font-medium text-gray-200"
                >
                  What is happening? *
                </FieldLabel>
                <Textarea
                  id="desc-input"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    if (descError) setDescError(null);
                  }}
                  rows={4}
                  maxLength={5000}
                  required
                  placeholder="Describe the problem, hazard size, obstruction, or immediate risk..."
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-amber-500/50"
                />
                {descError ? <FieldError>{descError}</FieldError> : null}
                <p className="text-[11px] text-gray-500">
                  {description.length}/5000 characters
                </p>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="title-input"
                  className="text-sm font-medium text-gray-200"
                >
                  Short Title{" "}
                  <span className="font-normal text-gray-500">(optional)</span>
                </FieldLabel>
                <Input
                  id="title-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={300}
                  placeholder="e.g. Deep pothole outside Farmgate Footover Bridge"
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-amber-500/50"
                />
              </Field>
            </div>
          ) : null}

          {/* Step 1 — location */}
          {step === 1 ? (
            <div className="space-y-4">
              <Field>
                <FieldLabel
                  htmlFor="street-input"
                  className="text-sm font-medium text-gray-200"
                >
                  Street Address or Landmark
                </FieldLabel>
                <Input
                  id="street-input"
                  value={locationName}
                  onChange={(event) => {
                    setLocationName(event.target.value);
                    if (locationError) setLocationError(null);
                  }}
                  placeholder="Mirpur Road, outside Pharmacist plaza"
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-amber-500/50"
                />
                {locationError ? (
                  <FieldError>{locationError}</FieldError>
                ) : null}
              </Field>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-200">
                  <IconMapPin className="size-3.5 text-amber-400" />
                  Click or drag map pin to precise spot
                </Label>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <MapboxMap
                    initialLat={latitude}
                    initialLng={longitude}
                    zoom={14}
                    onLocationSelect={(lat, lng, placeName) => {
                      setLatitude(lat);
                      setLongitude(lng);
                      if (placeName && !locationName)
                        setLocationName(placeName);
                    }}
                    className="h-[240px] w-full"
                  />
                </div>
                <p className="text-[11px] text-gray-500 tabular-nums">
                  📍 Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </p>
              </div>
            </div>
          ) : null}

          {/* Step 2 — review */}
          {step === 2 ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">
                Review Report Summary
              </h3>

              <dl className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 text-xs">
                <div className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4">
                  <dt className="w-28 shrink-0 text-gray-400 font-medium">
                    Category
                  </dt>
                  <dd className="text-gray-200">{categoryLabel(category)}</dd>
                </div>
                <div className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4">
                  <dt className="w-28 shrink-0 text-gray-400 font-medium">
                    Title
                  </dt>
                  <dd className="text-gray-200">
                    {title.trim() || description.trim().slice(0, 80)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4">
                  <dt className="w-28 shrink-0 text-gray-400 font-medium">
                    Description
                  </dt>
                  <dd className="text-gray-200 whitespace-pre-line">
                    {description.trim()}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4">
                  <dt className="w-28 shrink-0 text-gray-400 font-medium">
                    Location
                  </dt>
                  <dd className="text-gray-200">
                    {locationName.trim() || "No street specified"}
                    <span className="block text-[10px] text-gray-500 tabular-nums">
                      ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                    </span>
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-gray-400">
                Severity will be automatically evaluated via AI algorithm and
                dispatched to responsible city technicians.
              </p>
            </div>
          ) : null}
        </ScrollArea>

        {/* Footer Navigation */}
        <div className="border-t border-white/10 p-4 bg-[#111827] flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            disabled={step === 0 || submitting}
            className="gap-1.5 border-white/20 bg-white/5 text-gray-200 hover:bg-white/10"
          >
            <IconArrowLeft className="size-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={goNext}
              className="gap-1.5 bg-amber-500 text-black hover:bg-amber-400"
            >
              Next Step
              <IconArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5 bg-amber-500 text-black hover:bg-amber-400"
            >
              {submitting ? (
                <>
                  <Spinner />
                  Submitting…
                </>
              ) : (
                <>
                  Submit Report
                  <IconCheck className="size-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
