"use client";

import React from "react";
import { AlertTriangle, Trash2, CheckCircle2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="card-modern max-w-sm w-full p-6 bg-white shadow-2xl space-y-4 rounded-2xl border border-slate-200">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              variant === "danger"
                ? "bg-rose-50 text-rose-600"
                : variant === "warning"
                ? "bg-amber-50 text-amber-600"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            {variant === "danger" ? (
              <Trash2 className="w-5 h-5" />
            ) : variant === "warning" ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 btn-secondary text-xs py-2 rounded-xl cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 text-xs py-2 rounded-xl font-bold transition-colors cursor-pointer text-white shadow-xs ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
