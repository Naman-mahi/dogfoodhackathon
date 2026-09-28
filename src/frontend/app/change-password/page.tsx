"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { getStoredUser, fetchCurrentUser, AuthUser } from "@/lib/auth";
import { changePassword } from "@/lib/api";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      let user = getStoredUser();
      if (!user) {
        user = await fetchCurrentUser();
      }
      if (!user) {
        router.push("/login?redirect=/change-password");
        return;
      }
      setCurrentUser(user);
      setLoading(false);
    }
    loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        toast.success("Password changed successfully!");
        setSuccessMsg("Your password has been updated. You can use your new password next time you sign in.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMsg(res.error || "Failed to update password. Please check your current password.");
        toast.error(res.error || "Failed to change password.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected network error occurred.");
      toast.error("Network error while updating password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Calculate password strength
  const getStrength = (pwd: string) => {
    if (!pwd) return { label: "Empty", score: 0, color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { label: "Weak", score: 1, color: "bg-rose-500" };
    if (score <= 3) return { label: "Fair", score: 2, color: "bg-amber-500" };
    if (score <= 4) return { label: "Good", score: 3, color: "bg-blue-500" };
    return { label: "Strong", score: 4, color: "bg-emerald-500" };
  };

  const strength = getStrength(newPassword);

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href={
            currentUser?.role === "organizer"
              ? "/dashboard/organizer"
              : currentUser?.role === "judge"
              ? "/dashboard/judge"
              : "/dashboard"
          }
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Card */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Change Password
              </h1>
              <p className="text-xs text-slate-400">
                Update your account password for{" "}
                <span className="text-blue-400 font-semibold">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl flex items-start gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-200">Password Updated Successfully</p>
                <p className="mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-950/50 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold text-rose-200">Error</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Current Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-[#121828] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  New Password <span className="text-rose-400">*</span>
                </label>
                {newPassword && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Strength: <span className="font-bold text-slate-200">{strength.label}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#121828] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {newPassword && (
                <div className="mt-2 flex gap-1 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 rounded-full ${
                        step <= strength.score ? strength.color : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
              )}
              <span className="text-[10px] text-slate-500 mt-1 block">
                Must be at least 6 characters long.
              </span>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Confirm New Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full bg-[#121828] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <span className="text-[10px] text-rose-400 mt-1 block">
                  Passwords do not match.
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Link
                href="/settings"
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Go to Profile Settings
              </Link>
              <button
                type="submit"
                disabled={submitting || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
