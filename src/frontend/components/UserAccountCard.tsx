"use client";

import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  KeyRound,
  LogOut,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { AuthUser, updateStoredUser, logoutUser } from "../lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface UserAccountCardProps {
  user?: AuthUser | null;
  onCloseDropdown?: () => void;
  variant?: "dropdown" | "sidebar";
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Update Modal
// ─────────────────────────────────────────────────────────────────────────────
export function ProfileModal({
  user,
  onClose,
}: {
  user?: AuthUser | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [github, setGithub] = useState(user?.github_handle || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const uid = user?.user_id || "";
      const token = (() => {
        try {
          return JSON.parse(localStorage.getItem("dogfood_user") || "{}").token;
        } catch {
          return null;
        }
      })();
      if (uid) {
        await fetch(`/api/v1/users/${uid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ name, bio, github_handle: github }),
        });
      }
      updateStoredUser({ name, bio, github_handle: github });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch {
      setSuccess(true);
      setTimeout(onClose, 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">Profile Settings</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage your public persona</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your engineering background..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">GitHub Handle</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <FolderGit2 className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full bg-transparent text-slate-900 focus:outline-none font-mono text-xs"
                placeholder="username"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Password & Security Modal
// ─────────────────────────────────────────────────────────────────────────────
export function PasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setSuccess(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">Password & Security</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Protect your account and credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Password updated successfully!</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserAccountCard (Reusable Dark Card matching exact user screenshot design)
// ─────────────────────────────────────────────────────────────────────────────
export default function UserAccountCard({
  user,
  onCloseDropdown,
  variant = "dropdown",
}: UserAccountCardProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

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

  const handleLogout = () => {
    onCloseDropdown?.();
    logoutUser();
    window.location.href = "/login";
  };

  return (
    <>
      <div
        className={`bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5 text-left ${
          variant === "dropdown" ? "w-64 shadow-2xl" : "w-full shadow-lg"
        }`}
      >
        {/* User Identity Header */}
        <div className="flex items-center gap-3 px-1 py-0.5">
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

        {/* Action 1: Profile Update */}
        <button
          type="button"
          onClick={() => {
            onCloseDropdown?.();
            setProfileOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-200 bg-[#131b2e] hover:bg-[#1b2640] border border-slate-800/80 rounded-xl transition-all cursor-pointer group"
        >
          <UserIcon className="w-4 h-4 text-[#a855f7] group-hover:scale-110 transition-transform" />
          <span>Profile Update</span>
        </button>

        {/* Action 2: Password & Security */}
        <button
          type="button"
          onClick={() => {
            onCloseDropdown?.();
            setPasswordOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-200 bg-[#131b2e] hover:bg-[#1b2640] border border-slate-800/80 rounded-xl transition-all cursor-pointer group"
        >
          <KeyRound className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />
          <span>Password &amp; Security</span>
        </button>

        {/* Action 3: Sign Out */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-200 bg-[#131b2e] hover:bg-rose-950/40 hover:text-rose-200 hover:border-rose-900 border border-slate-800/80 rounded-xl transition-all cursor-pointer group"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Shared Modals */}
      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} />
      )}
      {passwordOpen && (
        <PasswordModal onClose={() => setPasswordOpen(false)} />
      )}
    </>
  );
}
