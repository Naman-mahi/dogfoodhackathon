"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CreateEventWizard from "../CreateEventWizard";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { getStoredUser, fetchCurrentUser, AuthUser } from "@/lib/auth";
import DashboardSidebar, { ORGANIZER_NAV, ORGANIZER_EXTRA } from "@/components/DashboardSidebar";

export default function NewEventPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const stored = getStoredUser();
      if (stored) setCurrentUser(stored);
      const remote = await fetchCurrentUser();
      if (remote) setCurrentUser(remote);
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  // RBAC: Only organizer role can access the creation wizard
  if (!currentUser || currentUser.role !== "organizer") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-slate-900">Organizer Access Required</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The event creation wizard is strictly restricted to authenticated hackathon organizers. Please sign in with an organizer account to deploy new events.
        </p>
        <Link href="/login" className="btn-primary text-xs py-2 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold inline-block">
          Sign In as Organizer
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] w-full bg-slate-50 text-slate-900">
      {/* Reusable Organizer Sidebar — "Create Hackathon" item highlighted via pathname */}
      <DashboardSidebar
        role="organizer"
        user={currentUser}
        navItems={ORGANIZER_NAV}
        extraLinks={ORGANIZER_EXTRA}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href="/dashboard"
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Console Overview
          </Link>
          <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">
            Live Deployment Engine
          </span>
        </div>

        <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" /></div>}>
          <CreateEventWizard />
        </Suspense>
      </main>
    </div>
  );
}
