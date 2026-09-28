"use client";

import {
  IconArrowLeft,
  IconShieldCheck,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  portalType?: "citizen" | "staff" | "none";
}

export default function AuthShell({
  icon,
  title,
  description,
  children,
  footer,
  portalType = "none",
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#0B1120] text-gray-100 selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="relative flex flex-1 items-center justify-center px-4 py-12 sm:py-16 overflow-hidden">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 size-96 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 w-full max-w-md space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-xl shadow-amber-500/10">
              {icon}
            </span>
            <div className="space-y-1.5">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          {portalType !== "none" && (
            <div className="grid grid-cols-2 p-1.5 bg-[#090D17] rounded-xl border border-[#233148] shadow-inner text-xs font-semibold">
              <Link
                href="/citizen/login"
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all",
                  portalType === "citizen"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "text-gray-400 hover:text-white hover:bg-[#111827]",
                )}
              >
                <IconUser className="size-3.5" />
                <span>Resident</span>
              </Link>
              <Link
                href="/staff/login"
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all",
                  portalType === "staff"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "text-gray-400 hover:text-white hover:bg-[#111827]",
                )}
              >
                <IconShieldCheck className="size-3.5" />
                <span>Staff Ops</span>
              </Link>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-[#111827] border border-[#27354A] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/60">
            {children}
          </div>

          {/* Footer Navigation */}
          {footer}

          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 transition"
            >
              <IconArrowLeft className="size-3.5" />
              <span>Back to public live board</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
