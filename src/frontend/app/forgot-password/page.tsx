"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reset Password</h1>
        <p className="text-xs text-slate-500">
          Enter your account email to receive reset instructions
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-slate-900">Check Your Email</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We have sent password reset instructions to{" "}
              <span className="font-semibold text-slate-800">{email}</span>.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-full transition-all shadow-sm"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.org"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-full transition-all shadow-md shadow-blue-500/20"
            >
              {loading ? "Sending Link..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1.5"
          >
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
