"use client";

import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { staffLogin } from "@/lib/auth";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await staffLogin(email, password);
      router.push("/staff/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid staff credentials");
    } finally {
      setLoading(false);
    }
  };

  const fillAdminDemo = () => {
    setEmail("admin@roads.gov");
    setPassword("Password123");
  };
  const fillTechDemo = () => {
    setEmail("tech@roads.gov");
    setPassword("Password123");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Municipal Staff Portal
            </h1>
            <p className="text-xs text-muted-foreground">
              Authorized Login for Administrators & Field Technicians
            </p>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xl space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@roads.gov"
                    className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Sign In to Staff Console</span>
                )}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="pt-3 border-t border-border/60 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block text-center">
                Quick Demo Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={fillAdminDemo}
                  className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-xl border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Fill Admin</span>
                </button>
                <button
                  type="button"
                  onClick={fillTechDemo}
                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-xl border border-blue-500/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Fill Tech</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
