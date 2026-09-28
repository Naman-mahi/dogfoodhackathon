"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  loginWithCredentials,
  quickPersonaLogin,
  socialLogin,
  TEST_PERSONAS,
  AuthUser,
} from "../../lib/auth";
import { ShieldCheck, UserCheck, Code, Award, CheckCircle2, AlertCircle } from "lucide-react";
import SocialAuthModal from "@/components/forms/SocialAuthModal";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Social Auth Modal State
  const [socialModal, setSocialModal] = useState<"google" | "github" | "linkedin" | null>(null);
  const [socialRole, setSocialRole] = useState<"participant" | "judge">("participant");

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await loginWithCredentials(email, password);
      const msg = `Signed in as ${user.name} (${user.role})`;
      setSuccess(msg);
      toast.success(`Welcome back, ${user.name}!`);
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: any) {
      const errText = err.message || "Failed to sign in. Please verify your credentials.";
      setError(errText);
      toast.error(errText);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (personaKey: "organizer" | "judge_a" | "judge_b" | "participant") => {
    setLoading(true);
    setError(null);
    try {
      const user = await quickPersonaLogin(personaKey);
      const msg = `Authenticated as ${user.name}`;
      setSuccess(msg);
      toast.success(`Switched persona: ${user.name} (${user.role})`);
      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    } catch (err: any) {
      const errText = err.message || "Persona authentication failed.";
      setError(errText);
      toast.error(errText);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSocial = async () => {
    if (!socialModal) return;
    setLoading(true);
    setError(null);
    try {
      const user = await socialLogin(socialModal, socialRole);
      const msg = `Connected with ${socialModal.toUpperCase()} as ${user.name}`;
      setSuccess(msg);
      toast.success(msg);
      setSocialModal(null);
      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    } catch (err: any) {
      const errText = err.message || "Social login failed.";
      setError(errText);
      toast.error(errText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-[10px] font-mono tracking-widest uppercase bg-slate-900 text-white px-2.5 py-1 rounded">
          Authentication Gateway
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Portal</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Sign in using test personas, social OAuth credentials, or direct email/password.
        </p>
      </div>

      {/* 1-Click Role Personas Bar */}
      <div className="card-modern p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Instant 1-Click Test Personas
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">Verified via Backend →</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin("organizer")}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all hover:scale-[1.01]"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Organizer</div>
              <div className="text-[10px] text-slate-400">Admin Control & CSV Export</div>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin("judge_a")}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all hover:scale-[1.01]"
          >
            <Award className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Judge A (Tomas)</div>
              <div className="text-[10px] text-slate-400">Isolated Track Scoring</div>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin("judge_b")}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all hover:scale-[1.01]"
          >
            <UserCheck className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Judge B (Wei)</div>
              <div className="text-[10px] text-slate-400">Blind Peer Score Review</div>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin("participant")}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all hover:scale-[1.01]"
          >
            <Code className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Participant (Ada)</div>
              <div className="text-[10px] text-slate-400">Team Nightshift Submissions</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="card-modern p-8 shadow-sm space-y-6">
        {/* Social Media Login (Google, GitHub, LinkedIn) */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Sign in with Social OAuth
          </label>
          <div className="flex items-center justify-center gap-3">
            {/* Google */}
            <button
              type="button"
              disabled={loading}
              onClick={() => setSocialModal("google")}
              aria-label="Sign in with Google"
              className="w-12 h-12 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-all shadow-xs group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </button>

            {/* GitHub */}
            <button
              type="button"
              disabled={loading}
              onClick={() => setSocialModal("github")}
              aria-label="Sign in with GitHub"
              className="w-12 h-12 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-all shadow-xs text-slate-800 hover:text-black group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              disabled={loading}
              onClick={() => setSocialModal("linkedin")}
              aria-label="Sign in with LinkedIn"
              className="w-12 h-12 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-all shadow-xs text-[#0A66C2] group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            Or with email credentials
          </span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleStandardLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. organizer@dogfood.dev or ada@example.org"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Demo password: demo2026)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-xs py-3"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>

      {/* Social OAuth Modal */}
      <SocialAuthModal
        isOpen={Boolean(socialModal)}
        provider={socialModal}
        role={socialRole}
        onRoleChange={setSocialRole}
        onClose={() => setSocialModal(null)}
        onConfirm={handleConfirmSocial}
        loading={loading}
        mode="login"
      />
    </div>
  );
}
