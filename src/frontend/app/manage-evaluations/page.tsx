"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, fetchCurrentUser, AuthUser } from "@/lib/auth";
import JudgeDashboard from "../dashboard/JudgeDashboard";
import JudgeProgressView from "@/components/JudgeProgressView";
import DashboardSidebar, { ORGANIZER_NAV } from "@/components/DashboardSidebar";
import { Loader2 } from "lucide-react";

export default function ManageEvaluationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const stored = getStoredUser();
      if (stored) setUser(stored);

      const remote = await fetchCurrentUser();
      if (remote) {
        setUser(remote);
        if (remote.role !== "judge" && remote.role !== "organizer" && remote.role !== "admin") {
          router.push("/dashboard");
        }
      } else if (!stored) {
        router.push("/login?redirect=/manage-evaluations");
      }
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  // If user is a judge, render their evaluation queue dashboard
  if (user?.role === "judge") {
    return <JudgeDashboard user={user} />;
  }

  // For organizers and admins, render the full Judge Evaluation Progress console
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900 w-full relative">
      <DashboardSidebar
        role={user?.role || "organizer"}
        user={user}
        activeTab="progress"
        navItems={ORGANIZER_NAV}
      />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 w-full">
        <JudgeProgressView />
      </main>
    </div>
  );
}
