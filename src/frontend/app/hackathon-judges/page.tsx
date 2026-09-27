"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, fetchCurrentUser, AuthUser } from "@/lib/auth";
import OrganizerDashboard from "../dashboard/OrganizerDashboard";
import { Loader2 } from "lucide-react";

export default function HackathonJudgesPage() {
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
        if (remote.role !== "organizer") {
          router.push("/dashboard");
        }
      } else if (!stored) {
        router.push("/login?redirect=/hackathon-judges");
      }
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return <OrganizerDashboard user={user} initialTab="hackathon_judges" />;
}
