"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Award,
  LayoutDashboard,
  Calendar,
  Sliders,
  Users,
  FileSpreadsheet,
  PlusCircle,
  LayoutList,
  Lock,
  History,
  BookOpen,
  Settings,
  Sparkles,
} from "lucide-react";
import { AuthUser } from "../lib/auth";
import UserAccountCard from "./UserAccountCard";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string; // if set, renders as <Link>; otherwise calls onTabChange
}

export interface DashboardSidebarProps {
  role: "organizer" | "judge";
  user?: AuthUser | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  navItems: SidebarNavItem[];
  extraLinks?: SidebarNavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Dashboard Sidebar Component
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardSidebar({
  role,
  user,
  activeTab,
  onTabChange,
  navItems,
  extraLinks = [],
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const isOrganizer = role === "organizer";

  return (
    <aside className="w-full lg:w-64 bg-[#080c16] text-white flex flex-col justify-between shrink-0 border-r border-slate-800/80 min-h-screen">
      {/* Top Section */}
      <div>
        {/* Branding & Console Badge Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isOrganizer
                  ? "bg-purple-950/60 border-purple-500/40 text-purple-400"
                  : "bg-blue-950/60 border-blue-500/40 text-blue-400"
              }`}
            >
              {isOrganizer ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Award className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-black text-sm tracking-wide text-white truncate flex items-center gap-1.5">
                {isOrganizer ? "Organizer Hub" : "Judge Console"}
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isOrganizer ? "bg-purple-400" : "bg-blue-400"
                  } animate-pulse`}
                />
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">
                {isOrganizer ? "Tier 1 & 2 Calibrated" : "Blind Peer Isolated"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 pt-4 pb-2">
          <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-2">
            Navigation
          </p>
          <nav className="space-y-1 text-xs font-semibold">
            {navItems.map((item) => {
              const isActive = item.href
                ? pathname === item.href
                : activeTab === item.id;

              const activeCls = isOrganizer
                ? "bg-purple-600 text-white shadow-md font-bold"
                : "bg-blue-600 text-white shadow-md font-bold";

              const inactiveCls =
                "text-slate-400 hover:text-white hover:bg-slate-800/70";

              const buttonCls = `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${
                isActive ? activeCls : inactiveCls
              }`;

              if (item.href) {
                return (
                  <Link key={item.id} href={item.href} className={buttonCls}>
                    <span className="shrink-0 transition-transform group-hover:scale-105">
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    )}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange?.(item.id)}
                  className={buttonCls}
                >
                  <span className="shrink-0 transition-transform group-hover:scale-105">
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Extra Action Links (e.g. Create Hackathon) */}
            {extraLinks.length > 0 && (
              <div className="pt-3 mt-2 border-t border-slate-800/70">
                <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-2">
                  Quick Actions
                </p>
                {extraLinks.map((item) => {
                  const isActive = item.href ? pathname === item.href : false;
                  const extraCls = `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-purple-600 text-white font-bold shadow-md"
                      : "text-purple-300 hover:text-white bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40"
                  }`;

                  if (item.href) {
                    return (
                      <Link key={item.id} href={item.href} className={extraCls}>
                        {item.icon}
                        <span className="flex-1 truncate font-semibold">
                          {item.label}
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onTabChange?.(item.id)}
                      className={extraCls}
                    >
                      {item.icon}
                      <span className="flex-1 truncate font-semibold">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Bottom Section: Reusable UserAccountCard */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/20">
        <UserAccountCard user={user} variant="sidebar" />
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-configured nav items for each role
// ─────────────────────────────────────────────────────────────────────────────
export const ORGANIZER_NAV: SidebarNavItem[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "events", label: "Manage Events", icon: <Calendar className="w-4 h-4" /> },
  { id: "lifecycle", label: "Event Lifecycle", icon: <Settings className="w-4 h-4" /> },
  { id: "rubric", label: "Rubric & Weights", icon: <Sliders className="w-4 h-4" /> },
  { id: "progress", label: "Judge Progress", icon: <Users className="w-4 h-4" /> },
  { id: "exports", label: "Export & Reports", icon: <FileSpreadsheet className="w-4 h-4" /> },
];

export const ORGANIZER_EXTRA: SidebarNavItem[] = [
  {
    id: "create",
    label: "Create Hackathon",
    icon: <PlusCircle className="w-4 h-4" />,
    href: "/events/new",
  },
];

export const JUDGE_NAV: SidebarNavItem[] = [
  { id: "queue", label: "Assigned Queue", icon: <LayoutList className="w-4 h-4" /> },
  { id: "isolation", label: "Peer Isolation", icon: <Lock className="w-4 h-4" /> },
  { id: "history", label: "My Evaluations", icon: <History className="w-4 h-4" /> },
  { id: "rubric", label: "Rubric Guide", icon: <BookOpen className="w-4 h-4" /> },
];
