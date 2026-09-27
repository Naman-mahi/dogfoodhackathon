"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar, { ORGANIZER_NAV, ORGANIZER_EXTRA } from "./DashboardSidebar";
import { AuthUser, getStoredUser, fetchCurrentUser } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface OrganizerLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function OrganizerLayout({
  children,
  activeTab = "overview",
  onTabChange,
}: OrganizerLayoutProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    fetchCurrentUser()
      .then((remote) => {
        if (remote) setUser(remote);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
      {/* Organizer Reusable Sidebar with Profile/Password at bottom */}
      <DashboardSidebar
        role="organizer"
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        navItems={ORGANIZER_NAV}
        extraLinks={ORGANIZER_EXTRA}
      />

      {/* Main Content Area — No footer */}
      <main className="flex-1 overflow-y-auto min-w-0 bg-white text-slate-900">
        {children}
      </main>
    </div>
  );
}
