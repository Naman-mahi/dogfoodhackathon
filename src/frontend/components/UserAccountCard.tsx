"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { AuthUser, logoutUser } from "../lib/auth";

export interface UserAccountCardProps {
  user?: AuthUser | null;
  onCloseDropdown?: () => void;
  variant?: "dropdown" | "sidebar";
}

export default function UserAccountCard({
  user,
  onCloseDropdown,
  variant = "dropdown",
}: UserAccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const role = user?.role || "participant";
  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Role accents
  const roleColors = {
    organizer: {
      avatarBg: "bg-[#281446]",
      avatarBorder: "border-[#5a2891]",
      avatarText: "text-[#d8b4fe]",
      roleLabel: "text-[#d946ef]",
    },
    judge: {
      avatarBg: "bg-[#0f2347]",
      avatarBorder: "border-[#1d4ed8]",
      avatarText: "text-[#93c5fd]",
      roleLabel: "text-[#38bdf8]",
    },
    participant: {
      avatarBg: "bg-[#063326]",
      avatarBorder: "border-[#059669]",
      avatarText: "text-[#6ee7b7]",
      roleLabel: "text-[#34d399]",
    },
  }[role] || {
    avatarBg: "bg-[#281446]",
    avatarBorder: "border-[#5a2891]",
    avatarText: "text-[#d8b4fe]",
    roleLabel: "text-[#d946ef]",
  };

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    onCloseDropdown?.();
    setMenuOpen(false);
    logoutUser();
    window.location.href = "/login";
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Sidebar Variant: Profile trigger button with popup dropdown menu above it
  // ─────────────────────────────────────────────────────────────────────────
  if (variant === "sidebar") {
    return (
      <div className="relative w-full" ref={containerRef}>
        {/* Dropdown Menu (pops open above the profile card) */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 w-full bg-[#0a0f1d] border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-800/80">
              <p className="text-[11px] font-bold text-white truncate">
                {user?.name || "DOGFOOD Admin"}
              </p>
              <p
                className={`text-[9px] font-mono uppercase font-bold tracking-wider ${roleColors.roleLabel}`}
              >
                {role} role
              </p>
            </div>

            {/* Profile -> opens dedicated /profile page */}
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer group"
            >
              <UserIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Profile</span>
            </Link>

            {/* Settings -> opens dedicated /settings page */}
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer group"
            >
              <Settings className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Settings</span>
            </Link>

            <div className="border-t border-slate-800/80 my-1" />

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer group"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Profile Card Trigger Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all cursor-pointer text-left border ${
            menuOpen
              ? "bg-[#131b2e] border-slate-700 shadow-md"
              : "bg-[#0a0f1d] hover:bg-[#131b2e] border-slate-800/80"
          }`}
          aria-expanded={menuOpen}
          aria-label="User Profile Menu"
        >
          <div
            className={`w-10 h-10 rounded-full ${roleColors.avatarBg} border ${roleColors.avatarBorder} flex items-center justify-center font-bold text-xs ${roleColors.avatarText} shrink-0`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {user?.name || "DOGFOOD User"}
            </p>
            <p
              className={`text-[10px] font-mono uppercase font-bold tracking-wider ${roleColors.roleLabel}`}
            >
              {role} role
            </p>
          </div>
          <div className="text-slate-400 pr-1">
            {menuOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Header Dropdown Variant (for participant role only)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-3 w-64 shadow-2xl space-y-2 text-left animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header Info */}
      <div className="flex items-center gap-3 px-1 py-1">
        <div
          className={`w-10 h-10 rounded-full ${roleColors.avatarBg} border ${roleColors.avatarBorder} flex items-center justify-center font-bold text-xs ${roleColors.avatarText} shrink-0`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate">
            {user?.name || "DOGFOOD User"}
          </p>
          <p
            className={`text-[10px] font-mono uppercase font-bold tracking-wider ${roleColors.roleLabel}`}
          >
            {role} role
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800/80 my-1" />

      {/* Option 1: Profile (New Page) */}
      <Link
        href="/profile"
        onClick={onCloseDropdown}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-200 bg-[#131b2e] hover:bg-[#1b2640] border border-slate-800/80 rounded-xl transition-all cursor-pointer group"
      >
        <UserIcon className="w-4 h-4 text-[#a855f7] group-hover:scale-110 transition-transform" />
        <span>Profile</span>
      </Link>

      {/* Option 2: Settings (New Page) */}
      <Link
        href="/settings"
        onClick={onCloseDropdown}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-200 bg-[#131b2e] hover:bg-[#1b2640] border border-slate-800/80 rounded-xl transition-all cursor-pointer group"
      >
        <Settings className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />
        <span>Settings</span>
      </Link>

      {/* Option 3: Sign Out */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-200 bg-[#131b2e] hover:bg-rose-950/40 hover:text-rose-200 hover:border-rose-900 border border-slate-800/80 rounded-xl transition-all cursor-pointer group"
      >
        <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
