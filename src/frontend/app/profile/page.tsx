"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  FolderGit2,
  FileText,
  Calendar,
  Trophy,
  Award,
  ShieldCheck,
  Settings,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { AuthUser, getStoredUser, fetchCurrentUser } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const stored = getStoredUser();
      if (stored) setUser(stored);

      const remote = await fetchCurrentUser();
      if (remote) {
        setUser(remote);
      } else if (!stored) {
        router.push("/login?redirect=/profile");
        return;
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Loading profile...</p>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role || "participant";
  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleColor = {
    organizer: {
      bg: "bg-purple-950/20 border-purple-200 text-purple-700",
      badge: "bg-purple-100 text-purple-800 border-purple-200",
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      accent: "purple",
    },
    judge: {
      bg: "bg-blue-950/20 border-blue-200 text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <Award className="w-5 h-5 text-blue-600" />,
      accent: "blue",
    },
    participant: {
      bg: "bg-emerald-950/20 border-emerald-200 text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <Trophy className="w-5 h-5 text-emerald-600" />,
      accent: "emerald",
    },
  }[role] || {
    bg: "bg-slate-100 border-slate-200 text-slate-700",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    icon: <User className="w-5 h-5 text-slate-600" />,
    accent: "blue",
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <Link
          href="/settings"
          className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 shadow-xs"
        >
          <Settings className="w-3.5 h-3.5" />
          Edit Profile & Settings
        </Link>
      </div>

      {/* Main Profile Hero Card */}
      <div className="card-modern p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 p-0.5 shadow-lg">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center font-black text-2xl text-white">
                {initials}
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">{user.name}</h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-white/10 text-white border border-white/20">
                {role} role
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {user.bio || "DOGFOOD Hackathon platform member and engineering innovator."}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user.email}</span>
              </div>
              {user.github_handle && (
                <a
                  href={`https://github.com/${user.github_handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>@{user.github_handle}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Stats & Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card-modern p-5 space-y-1 border-l-4 border-l-purple-500">
          <div className="text-[11px] font-mono uppercase font-bold text-slate-400">System Role</div>
          <div className="text-lg font-black text-slate-900 capitalize flex items-center gap-2">
            {roleColor.icon}
            {role}
          </div>
          <p className="text-xs text-slate-500 pt-1">
            {role === "organizer" && "Manage hackathon lifecycles, rubric weights, and matrices."}
            {role === "judge" && "Assigned to blind peer-isolated submission evaluation queue."}
            {role === "participant" && "Submit projects, collaborate in teams, and track scores."}
          </p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-l-blue-500">
          <div className="text-[11px] font-mono uppercase font-bold text-slate-400">Account Status</div>
          <div className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Active & Verified
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Single-sign-on authenticated with OAuth and cookie-backed session.
          </p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-l-emerald-500">
          <div className="text-[11px] font-mono uppercase font-bold text-slate-400">Quick Actions</div>
          <div className="pt-2 space-y-2">
            <Link
              href="/settings"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" /> Configure settings
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
