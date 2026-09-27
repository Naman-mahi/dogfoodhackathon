"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, fetchCurrentUser, AuthUser } from "../../lib/auth";
import OrganizerDashboard from "./OrganizerDashboard";
import JudgeDashboard from "./JudgeDashboard";
import ParticipantDashboard from "./ParticipantDashboard";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function MasterDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuthentication() {
      // 1. Check local session first for fast load
      const stored = getStoredUser();
      if (stored) {
        setCurrentUser(stored);
      }

      // 2. Validate session against live backend /api/v1/auth/me
      const remote = await fetchCurrentUser();
      if (remote) {
        setCurrentUser(remote);
        setLoading(false);
      } else if (!stored) {
        // Visitor / unauthenticated user: strictly redirect to login
        setLoading(false);
        router.push("/login?redirect=/dashboard");
      } else {
        setLoading(false);
      }
    }

    verifyAuthentication();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-mono">
          Verifying security session...
        </p>
      </div>
    );
  }

  // If visitor is unauthenticated, prompt or redirect
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Authentication Required</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The dashboard is restricted to registered participants, judges, and organizers. Visitors must sign in to view this area.
        </p>
        <div className="pt-2">
          <Link href="/login?redirect=/dashboard" className="btn-primary text-xs py-2.5 px-6">
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  // 1. Organizer Role -> Left Sidebar Dashboard Layout
  if (currentUser.role === "organizer") {
    return <OrganizerDashboard user={currentUser} />;
  }

  // 2. Judge Role -> Left Sidebar Dashboard Layout
  if (currentUser.role === "judge") {
    return <JudgeDashboard user={currentUser} />;
  }

  // 3. Participant Role -> Clean Wide Layout (NO sidebar)
  return <ParticipantDashboard user={currentUser} />;
}
