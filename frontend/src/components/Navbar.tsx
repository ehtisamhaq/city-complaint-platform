"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import RagAssistantModal from "@/components/RagAssistantModal";
import type { User } from "@/lib/api";
import { getClientUser, logout } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isRagOpen, setIsRagOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setUser(getClientUser());
  }, []);

  const navItems = [
    { label: "Overview", path: "/" },
    { label: "Report Hazard (AI)", path: "/report" },
    { label: "Track Requests", path: "/citizen/dashboard" },
    { label: "Ops Command", path: "/staff/dashboard" },
    { label: "City Metrics", path: "/rag" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#ffffff]/80 backdrop-blur-md border-b border-[#e8e7f1]">
        <div className="h-14 max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-5">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-[#18181b] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[18px]">
                  apartment
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm text-[#18181b] tracking-tight">
                CivicPulse
              </span>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-3 py-1.5 rounded-lg transition-colors font-label-md text-label-md ${
                      active
                        ? "text-[#18181b] bg-[#e8e7f1] font-semibold"
                        : "text-[#47464b] hover:text-[#1a1b22] hover:bg-[#eeedf7]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Accessories & Profile */}
          <div className="flex items-center gap-3 flex-1 max-w-sm justify-end">
            {/* Search Input Bar with ⌘K */}
            <div
              onClick={() => setIsRagOpen(true)}
              className="hidden md:flex items-center w-full max-w-xs px-3 py-1.5 bg-[#ffffff] rounded-lg border border-[#e3e1ec] shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] cursor-pointer hover:border-[#0051d5] transition-all"
            >
              <span className="material-symbols-outlined text-[#47464b] text-[16px] mr-2">
                search
              </span>
              <span className="w-full text-[#47464b] font-body-sm text-body-sm truncate">
                Search issues, locations, or AI...
              </span>
              <span className="font-code text-code px-1.5 py-0.5 rounded bg-[#e8e7f1] text-[#47464b]">
                ⌘K
              </span>
            </div>

            {/* System Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eeedf7] border border-[#e3e1ec]">
              <span className="w-2 h-2 rounded-full bg-[#009668] animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-[#1a1b22] font-medium whitespace-nowrap">
                All Systems Operational
              </span>
            </div>

            {/* Notifications Button */}
            <button
              onClick={() => setIsRagOpen(true)}
              className="p-1.5 text-[#47464b] hover:text-[#1a1b22] hover:bg-[#eeedf7] rounded-lg transition-colors"
              title="Notifications & AI Assistant"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
            </button>

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={logout}
                  title={`Sign out (${user.fullName})`}
                  className="w-8 h-8 rounded-full bg-[#18181b] text-white flex items-center justify-center font-bold text-xs hover:bg-[#2f3038] transition-colors"
                >
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </button>
              </div>
            ) : (
              <Link
                href="/citizen/login"
                className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center text-white hover:bg-[#2f3038] transition-colors"
                title="Sign In"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person
                </span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 text-[#47464b] hover:text-[#1a1b22]"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-b border-[#e3e1ec] bg-[#ffffff] px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg font-label-md text-label-md ${
                  isActive(item.path)
                    ? "bg-[#e8e7f1] text-[#18181b] font-semibold"
                    : "text-[#47464b] hover:bg-[#eeedf7]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setIsRagOpen(true);
              }}
              className="w-full text-left px-3 py-2 font-label-md text-label-md text-[#0051d5] bg-[#dbe1ff] rounded-lg"
            >
              ✨ Ask City AI Assistant (⌘K)
            </button>
          </div>
        )}
      </header>

      <RagAssistantModal
        isOpen={isRagOpen}
        onClose={() => setIsRagOpen(false)}
      />
    </>
  );
}
