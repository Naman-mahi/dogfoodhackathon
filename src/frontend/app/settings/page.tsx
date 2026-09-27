"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getStoredUser,
  fetchCurrentUser,
  saveStoredUser,
  AuthUser,
} from "../../lib/auth";
import {
  User,
  Mail,
  Github,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Camera,
} from "lucide-react";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    github_handle: "",
    avatar_url: "",
  });

  useEffect(() => {
    async function loadUser() {
      let user = getStoredUser();
      if (!user) {
        user = await fetchCurrentUser();
      }
      if (!user) {
        router.push("/login?redirect=/settings");
        return;
      }

      setCurrentUser(user);

      // Fetch user profile from backend
      try {
        const res = await fetch(`/api/v1/users/${user.user_id}`);
        if (res.ok) {
          const profile = await res.json();
          setFormData({
            name: profile.name || user.name || "",
            email: profile.email || user.email || "",
            bio: profile.bio || "DOGFOOD hackathon builder and platform participant.",
            github_handle: profile.github_handle || "",
            avatar_url: profile.avatar_url || user.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`,
          });
        } else {
          setFormData({
            name: user.name || "",
            email: user.email || "",
            bio: "DOGFOOD hackathon builder and platform participant.",
            github_handle: "",
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`,
          });
        }
      } catch {
        setFormData({
          name: user.name || "",
          email: user.email || "",
          bio: "DOGFOOD hackathon builder and platform participant.",
          github_handle: "",
          avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`,
        });
      }

      setLoading(false);
    }
    loadUser();
  }, [router]);

  const handleUpdateAvatarSeed = (seed: string) => {
    setFormData((prev) => ({
      ...prev,
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/v1/users/${currentUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
          github_handle: formData.github_handle || undefined,
          avatar_url: formData.avatar_url,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update profile settings.");
      }

      const updated = await res.json();
      const newStoredUser: AuthUser = {
        ...currentUser,
        name: updated.name,
        email: updated.email,
        avatar_url: updated.avatar_url,
      };
      saveStoredUser(newStoredUser);
      setCurrentUser(newStoredUser);
      setSuccessMsg("Profile settings updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Loading profile settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-bold">
          Account Settings
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Profile Settings
        </h1>
        <p className="text-xs text-slate-500">
          Manage your account profile, bio, avatar, and hackathon builder identity.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="card-modern p-6 sm:p-10 shadow-sm space-y-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Preview & Seed Selection */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <img
                src={formData.avatar_url}
                alt={formData.name}
                className="w-20 h-20 rounded-full border-2 border-white shadow-md bg-white"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-full shadow-xs">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Profile Avatar</h3>
                <p className="text-xs text-slate-500">
                  Select an identity avatar style or customize your seed:
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                {["alpha", "builder", "zenith", "cyber", "pixel"].map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => handleUpdateAvatarSeed(seed)}
                    className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    Style {seed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-400" />
                GitHub Handle
              </label>
              <input
                type="text"
                value={formData.github_handle}
                onChange={(e) => setFormData({ ...formData, github_handle: e.target.value })}
                placeholder="e.g. jsmith-dev"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                System Role (Assigned)
              </label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold uppercase text-slate-600 cursor-not-allowed">
                {currentUser?.role || "participant"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Bio / Experience Summary
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-mono">
              User ID: {currentUser?.user_id}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs py-2.5 px-6"
            >
              {saving ? "Saving Changes..." : "Save Profile Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
