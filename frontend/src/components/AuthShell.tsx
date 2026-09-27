"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AuthShellProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({
  icon,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              {icon}
            </span>
            <div className="space-y-1.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">{children}</CardContent>
          </Card>

          {footer}

          <div className="text-center">
            <Link
              href="/"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "gap-1.5 text-muted-foreground",
              })}
            >
              <IconArrowLeft className="size-3.5" />
              Back to the public board
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
