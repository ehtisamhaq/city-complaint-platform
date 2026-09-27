"use client";

import {
  IconBuildingCommunity,
  IconChevronRight,
  IconLayoutDashboard,
  IconLogout,
  IconMapPin,
  IconMenu2,
  IconMessage,
  IconMoon,
  IconSearch,
  IconSparkles,
  IconSun,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import RagAssistantModal from "@/components/RagAssistantModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { User } from "@/lib/api";
import { getClientUser, logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", path: "/", icon: IconMapPin },
  { label: "Report an issue", path: "/report", icon: IconSparkles },
  {
    label: "My requests",
    path: "/citizen/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    label: "Ops console",
    path: "/staff/dashboard",
    icon: IconBuildingCommunity,
  },
  { label: "City metrics", path: "/rag", icon: IconMessage },
];

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return { dark, toggle };
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ragOpen, setRagOpen] = useState(false);
  const { dark, toggle } = useTheme();

  useEffect(() => {
    setUser(getClientUser());
  }, []);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconBuildingCommunity className="size-4.5" />
            </span>
            <span className="font-heading text-base font-bold tracking-tight">
              CityPulse
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={active ? "page" : undefined}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: cn(
                      "font-medium",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    ),
                  })}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Assistant trigger, doubles as the search affordance */}
            <Button
              variant="outline"
              onClick={() => setRagOpen(true)}
              className="hidden h-9 w-56 justify-start gap-2 text-muted-foreground md:flex"
            >
              <IconSearch className="size-4" />
              <span className="flex-1 text-left">Ask the city…</span>
              <Kbd>⌘K</Kbd>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRagOpen(true)}
              aria-label="Open the municipal assistant"
              className="md:hidden"
            >
              <IconSearch className="size-4" />
            </Button>

            <Badge
              variant="outline"
              className="hidden gap-1.5 border-success/30 bg-success/10 text-success xl:inline-flex"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              All systems operational
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
            >
              {dark ? (
                <IconSun className="size-4" />
              ) : (
                <IconMoon className="size-4" />
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Account menu"
                    />
                  }
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                      {user.fullName?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">
                        {user.fullName}
                      </span>
                      <span className="truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      render={<Link href="/citizen/dashboard" />}
                    >
                      <IconUser className="size-4" />
                      My requests
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/staff/dashboard" />}>
                      <IconBuildingCommunity className="size-4" />
                      Ops console
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={logout}>
                    <IconLogout className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/citizen/login"
                className={buttonVariants({ size: "sm" })}
              >
                Sign in
              </Link>
            )}

            {/* Mobile nav */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open navigation"
                    className="lg:hidden"
                  />
                }
              >
                <IconMenu2 className="size-4" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
                <SheetHeader className="border-b p-4">
                  <SheetTitle className="text-left">CityPulse</SheetTitle>
                  <SheetDescription className="text-left">
                    Municipal complaint and service request platform
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4">
                  {navItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        aria-current={active ? "page" : undefined}
                        className={buttonVariants({
                          variant: "ghost",
                          className: cn(
                            "h-auto w-full justify-start gap-3 py-2.5",
                            active
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground",
                          ),
                        })}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {active ? (
                          <IconChevronRight className="size-4 shrink-0" />
                        ) : null}
                      </Link>
                    );
                  })}
                  <Separator className="my-2" />
                  <Button
                    variant="outline"
                    onClick={() => setRagOpen(true)}
                    className="w-full justify-start gap-3"
                  >
                    <IconSparkles className="size-4" />
                    Ask the city assistant
                  </Button>
                  <Separator className="my-2" />
                  {user ? (
                    <Button
                      variant="ghost"
                      onClick={logout}
                      className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <IconLogout className="size-4" />
                      Sign out
                    </Button>
                  ) : (
                    <Link
                      href="/citizen/login"
                      className={buttonVariants({ className: "w-full" })}
                    >
                      Sign in
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <RagAssistantModal isOpen={ragOpen} onClose={() => setRagOpen(false)} />
    </>
  );
}
