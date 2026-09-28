"use client";

import React from "react";
import { X, ShieldCheck } from "lucide-react";

interface SocialAuthModalProps {
  isOpen: boolean;
  provider: "google" | "github" | "linkedin" | null;
  role: "participant" | "judge";
  onRoleChange: (role: "participant" | "judge") => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  mode?: "login" | "register";
}

export default function SocialAuthModal({
  isOpen,
  provider,
  role,
  onRoleChange,
  onClose,
  onConfirm,
  loading,
  mode = "login",
}: SocialAuthModalProps) {
  if (!isOpen || !provider) return null;

  const providerName =
    provider === "google"
      ? "Google"
      : provider === "github"
      ? "GitHub"
      : provider === "linkedin"
      ? "LinkedIn"
      : provider;

  const actionText = mode === "register" ? "Register via" : "Connect with";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="card-modern max-w-sm w-full p-6 bg-white shadow-2xl space-y-5 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
              {providerName[0]}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {actionText} {providerName}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                OAuth 2.0 Identity Gateway
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Select your intended platform role to complete authentication via {providerName}:
        </p>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onRoleChange("participant")}
              className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                role === "participant"
                  ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="font-bold">Participant</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Build &amp; submit</div>
            </button>
            <button
              type="button"
              onClick={() => onRoleChange("judge")}
              className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                role === "judge"
                  ? "border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="font-bold">Judge</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Evaluate &amp; score</div>
            </button>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 btn-secondary text-xs py-2.5 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 btn-primary text-xs py-2.5 rounded-xl cursor-pointer font-bold"
          >
            {loading ? "Connecting..." : "Authorize"}
          </button>
        </div>
      </div>
    </div>
  );
}
