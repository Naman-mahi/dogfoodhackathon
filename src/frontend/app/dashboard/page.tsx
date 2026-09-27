"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getStoredUser,
  fetchCurrentUser,
  logoutUser,
  quickPersonaLogin,
  AuthUser,
} from "../../lib/auth";
import OrganizerDashboard from "./OrganizerDashboard";
import JudgeDashboard from "./JudgeDashboard";
import ParticipantDashboard from "./ParticipantDashboard";
import { ShieldCheck, Award, UserCheck, Code, LogOut, ArrowRight } from "lucide-react";

export default function MasterDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeRoleTab, setActiveRoleTab] = useState<"organizer" | "judge" | "participant">("organizer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initUser() {
      const stored = getStoredUser();
      if (stored) {
        setCurrentUser(stored);
        if (stored.role === "organizer" || stored.role === "judge" || stored.role === "participant") {
          setActiveRoleTab(stored.role as any);
        }
      }
      const remote = await fetchCurrentUser();
      if (remote) {
        setCurrentUser(remote);
        if (remote.role === "organizer" || remote.role === "judge" || remote.role === "participant") {
          setActiveRoleTab(remote.role as any);
        }
      }
      setLoading(false);
    }
    initUser();
  }, []);

  const handleRoleTabSwitch = async (role: "organizer" | "judge" | "participant") => {
    setActiveRoleTab(role);
    // Also simulate quick persona switch
    const personaKey = role === "organizer" ? "organizer" : role === "judge" ? "judge_a" : "participant";
    const user = await quickPersonaLogin(personaKey);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    router.push("/login");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Role Switcher & Active Persona Bar */}
      <div className="card-modern p-3 bg-white shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleRoleTabSwitch("organizer")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeRoleTab === "organizer"
                ? "bg-white text-purple-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Organizer View
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabSwitch("judge")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeRoleTab === "judge"
                ? "bg-white text-blue-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-blue-600" />
            Judge View
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabSwitch("participant")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeRoleTab === "participant"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code className="w-3.5 h-3.5 text-emerald-600" />
            Participant View
          </button>
        </div>

        {/* Current Active Persona & Logout */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <img
                src={
                  currentUser.avatar_url ||
                  `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.email}`
                }
                alt="Avatar"
                className="w-7 h-7 rounded-full border border-slate-200"
              />
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Role: <span className="uppercase font-bold text-blue-600">{currentUser.role}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              Sign In to Save Persona <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Role Dashboard Component */}
      {activeRoleTab === "organizer" && <OrganizerDashboard />}
      {activeRoleTab === "judge" && <JudgeDashboard />}
      {activeRoleTab === "participant" && <ParticipantDashboard />}
    </div>
  );
}
