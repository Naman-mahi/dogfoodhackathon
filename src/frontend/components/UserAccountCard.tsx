"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
  BadgeCheck,
  KeyRound,
} from "lucide-react";
import { AuthUser, logoutUser } from "../lib/auth";
import toast from "react-hot-toast";

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

  // Role accents - Clean light theme
  const roleColors = {
    admin: {
      avatarBg: "bg-purple-100",
      avatarBorder: "border-purple-200",
      avatarText: "text-purple-700",
      roleLabel: "text-purple-600",
    },
    organizer: {
      avatarBg: "bg-fuchsia-100",
      avatarBorder: "border-fuchsia-200",
      avatarText: "text-fuchsia-700",
      roleLabel: "text-fuchsia-600",
    },
    judge: {
      avatarBg: "bg-blue-100",
      avatarBorder: "border-blue-200",
      avatarText: "text-blue-700",
      roleLabel: "text-blue-600",
    },
    participant: {
      avatarBg: "bg-emerald-100",
      avatarBorder: "border-emerald-200",
      avatarText: "text-emerald-700",
      roleLabel: "text-emerald-600",
    },
  }[role] || {
    avatarBg: "bg-blue-100",
    avatarBorder: "border-blue-200",
    avatarText: "text-blue-700",
    roleLabel: "text-blue-600",
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
    toast.success("Signed out successfully.");
    logoutUser();
    setTimeout(() => {
      window.location.href = "/login";
    }, 300);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Sidebar Variant: Profile trigger button with popup dropdown menu above it
  // ─────────────────────────────────────────────────────────────────────────
  if (variant === "sidebar") {
    return (
      <div className="relative w-full" ref={containerRef}>
        {/* Dropdown Menu (pops open above the profile card) */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 w-full bg-white border border-slate-200 rounded-2xl p-2 shadow-xl z-50 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-[11px] font-bold text-slate-900 truncate">
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
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group"
            >
              <UserIcon className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              <span>Profile</span>
            </Link>

            {(role === "admin" || role === "organizer") && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer group"
              >
                <Settings className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                <span>Admin Console</span>
              </Link>
            )}

            {/* Certificates - Participants Only */}
            {role === "participant" && (
              <Link
                href="/certificates"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group"
              >
                <BadgeCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span>My Certificates</span>
              </Link>
            )}

            {/* Settings -> opens dedicated /settings page */}
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group"
            >
              <Settings className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Settings</span>
            </Link>

            {/* Change Password */}
            <Link
              href="/change-password"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group"
            >
              <KeyRound className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span>Change Password</span>
            </Link>

            <div className="border-t border-slate-100 my-1" />

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer group"
            >
              <LogOut className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-all" />
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
              ? "bg-slate-100 border-slate-300 shadow-sm"
              : "bg-slate-50 hover:bg-slate-100 border-slate-200"
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
            <p className="text-xs font-bold text-slate-900 truncate">
              {user?.name || "DOGFOOD User"}
            </p>
            <p
              className={`text-[10px] font-mono uppercase font-bold tracking-wider ${roleColors.roleLabel}`}
            >
              {role} role
            </p>
          </div>
          <div className="text-slate-500 pr-1">
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
  // Header Dropdown Variant (clean white card, light theme)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="bg-white border border-slate-200 rounded-2xl p-2.5 w-64 shadow-xl space-y-1 text-left animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header Info */}
      <div className="flex items-center gap-3 px-2 py-2">
        <div
          className={`w-10 h-10 rounded-full ${roleColors.avatarBg} border ${roleColors.avatarBorder} flex items-center justify-center font-bold text-xs ${roleColors.avatarText} shrink-0`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 truncate">
            {user?.name || "DOGFOOD User"}
          </p>
          <p
            className={`text-[10px] font-mono uppercase font-bold tracking-wider ${roleColors.roleLabel}`}
          >
            {role} role
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 my-1" />

      {/* Option 1: Profile */}
      <Link
        href="/profile"
        onClick={onCloseDropdown}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group"
      >
        <UserIcon className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
        <span>Profile</span>
      </Link>

      {(role === "admin" || role === "organizer") && (
        <Link
          href="/admin"
          onClick={onCloseDropdown}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer group"
        >
          <Settings className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          <span>Admin Console</span>
        </Link>
      )}

      {/* Option 1b: Certificates (Participant only) */}
      {role === "participant" && (
        <Link
          href="/certificates"
          onClick={onCloseDropdown}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group"
        >
          <BadgeCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          <span>My Certificates</span>
        </Link>
      )}

      {/* Option 2: Settings */}
      <Link
        href="/settings"
        onClick={onCloseDropdown}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group"
      >
        <Settings className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
        <span>Settings</span>
      </Link>

      {/* Option 2b: Change Password */}
      <Link
        href="/change-password"
        onClick={onCloseDropdown}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group"
      >
        <KeyRound className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
        <span>Change Password</span>
      </Link>

      <div className="border-t border-slate-100 my-1" />

      {/* Option 3: Sign Out */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer group"
      >
        <LogOut className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-all" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
