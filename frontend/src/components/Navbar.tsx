"use client";

import {
  IconBuildingCommunity,
  IconChevronRight,
  IconClipboardList,
  IconLayoutDashboard,
  IconLogout,
  IconMapPin,
  IconMenu2,
  IconMessage,
  IconMoon,
  IconPlus,
  IconSearch,
  IconShield,
  IconShieldCheck,
  IconSparkles,
  IconSun,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import RagAssistantModal from "@/components/RagAssistantModal";
import ReportModal from "@/components/ReportModal";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  audience: ("public" | "citizen" | "staff")[];
};

const allNavItems: NavItem[] = [
  {
    label: "Live Board",
    path: "/",
    icon: IconMapPin,
    audience: ["public", "citizen", "staff"],
  },
  {
    label: "Complaints",
    path: "/complaints",
    icon: IconClipboardList,
    audience: ["public", "citizen", "staff"],
  },
  {
    label: "My Requests",
    path: "/citizen/dashboard",
    icon: IconLayoutDashboard,
    audience: ["citizen"],
  },
  {
    label: "Ops Console",
    path: "/staff/dashboard",
    icon: IconBuildingCommunity,
    audience: ["staff"],
  },
  {
    label: "Knowledge Desk",
    path: "/rag",
    icon: IconMessage,
    audience: ["public", "citizen", "staff"],
  },
];

function useTheme() {
  const [dark, setDark] = useState(true);

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

  const isStaff = user?.role === "ADMIN" || user?.role === "TECHNICIAN";
  const navItems = allNavItems.filter((item) => {
    if (!user) return item.audience.includes("public");
    if (isStaff) return item.audience.includes("staff");
    return item.audience.includes("citizen");
  });

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group outline-none shrink-0"
          >
            <div className="size-9 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="size-full bg-background rounded-md flex items-center justify-center">
                <IconShield className="size-4.5 text-amber-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5 font-heading leading-tight">
                NAGAR{" "}
                <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 font-semibold border border-amber-500/30">
                  CIVIC
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide leading-tight hidden sm:block">
                Dhaka Municipal Rapid Response
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* AI Assistant */}
            <Button
              variant="outline"
              onClick={() => setRagOpen(true)}
              className="hidden sm:inline-flex h-9 items-center gap-2 px-3.5 text-xs font-semibold"
            >
              <IconSearch className="size-3.5 text-amber-500 dark:text-amber-400" />
              <span>Ask Assistant</span>
              <Kbd className="text-[10px]">⌘K</Kbd>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setRagOpen(true)}
              aria-label="Ask Assistant"
              className="sm:hidden size-9"
            >
              <IconSearch className="size-4" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
              className="text-muted-foreground hover:text-foreground hover:bg-accent size-9"
            >
              {dark ? (
                <IconSun className="size-4 text-amber-500 dark:text-amber-400" />
              ) : (
                <IconMoon className="size-4" />
              )}
            </Button>

            {/* Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 p-1 pr-2.5 hover:bg-accent transition outline-none"
                      aria-label="Account menu"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-amber-500 text-[11px] font-bold text-primary-foreground">
                          {user.fullName?.charAt(0).toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block text-xs font-medium text-foreground max-w-24 truncate">
                        {user.fullName?.split(" ")[0]}
                      </span>
                    </button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {user.fullName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                      <span className="text-[10px] text-amber-500 dark:text-amber-400 font-mono uppercase font-semibold mt-1">
                        {user.role}
                      </span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {isStaff ? (
                      <DropdownMenuItem
                        render={<Link href="/staff/dashboard" />}
                      >
                        <IconBuildingCommunity className="size-4 text-amber-500 dark:text-amber-400" />
                        Ops Command
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        render={<Link href="/citizen/dashboard" />}
                      >
                        <IconUser className="size-4 text-amber-500 dark:text-amber-400" />
                        My Requests
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem render={<Link href="/report" />}>
                      <IconSparkles className="size-4 text-amber-500 dark:text-amber-400" />
                      Report Issue
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
              <div className="flex items-center gap-2">
                <Link
                  href="/staff/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg border border-border/80 hover:bg-accent/50 transition"
                  title="Municipal Staff & Technician Operations Portal"
                >
                  <IconShieldCheck className="size-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Staff Ops</span>
                </Link>
                <Link
                  href="/citizen/login"
                  className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm hover:shadow-amber-500/20 transition-all active:scale-[0.98]"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open navigation"
                    className="lg:hidden size-9"
                  />
                }
              >
                <IconMenu2 className="size-4" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
                <SheetHeader className="border-b border-border p-5">
                  <SheetTitle className="text-left font-bold text-foreground text-lg flex items-center gap-2">
                    NAGAR{" "}
                    <span className="text-amber-500 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                      CIVIC
                    </span>
                  </SheetTitle>
                  <SheetDescription className="text-left text-xs text-muted-foreground">
                    Dhaka Municipal Rapid Response Portal
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
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          active
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        )}
                      >
                        <Icon className="size-4 text-amber-500 dark:text-amber-400 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {active ? (
                          <IconChevronRight className="size-4 opacity-70" />
                        ) : null}
                      </Link>
                    );
                  })}
                  <Separator className="my-3" />
                  <Button
                    variant="outline"
                    onClick={() => setRagOpen(true)}
                    className="w-full justify-start gap-3"
                  >
                    <IconSparkles className="size-4 text-amber-500 dark:text-amber-400" />
                    Municipal AI Assistant
                  </Button>
                  <Separator className="my-3" />
                  {user ? (
                    <Button
                      variant="ghost"
                      onClick={logout}
                      className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
                    >
                      <IconLogout className="size-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/citizen/login"
                        className="w-full py-2.5 text-center font-bold text-xs uppercase tracking-wider text-primary-foreground bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm"
                      >
                        Citizen Sign In
                      </Link>
                      <Link
                        href="/staff/login"
                        className="w-full py-2 text-center font-medium text-xs tracking-wider text-muted-foreground hover:text-foreground border border-border/80 rounded-lg flex items-center justify-center gap-1.5 hover:bg-accent/50 transition"
                      >
                        <IconShieldCheck className="size-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Staff Ops Portal</span>
                      </Link>
                    </div>
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
