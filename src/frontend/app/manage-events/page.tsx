"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredUser, fetchCurrentUser, AuthUser } from "@/lib/auth";
import OrganizerDashboard from "../dashboard/OrganizerDashboard";
import { Loader2 } from "lucide-react";

export default function ManageEventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      }
    >
      <ManageEventsContent />
    </Suspense>
  );
}

function ManageEventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if a specific slug was passed in query parameter (e.g. ?slug=sample-hack-2026 or ?events?slug=...)
  useEffect(() => {
    let targetSlug = searchParams.get("slug") || searchParams.get("event");
    if (!targetSlug) {
      // In case user navigated with ?events?slug=sample-hack-2026
      for (const [key, val] of searchParams.entries()) {
        if (key.includes("slug")) {
          targetSlug = val || key.split("slug=")[1];
          break;
        }
      }
    }

    if (targetSlug) {
      router.replace(`/manage-events/${targetSlug}`);
      return;
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function init() {
      const stored = getStoredUser();
      if (stored) setUser(stored);

      const remote = await fetchCurrentUser();
      if (remote) {
        setUser(remote);
        if (remote.role !== "organizer" && remote.role !== "admin") {
          router.push("/dashboard");
        }
      } else if (!stored) {
        router.push("/login?redirect=/manage-events");
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

  return <OrganizerDashboard user={user} initialTab="events" />;
}
