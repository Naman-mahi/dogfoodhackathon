"use client";

import React from "react";
import Link from "next/link";
import CreateEventWizard from "../CreateEventWizard";
import { ArrowLeft } from "lucide-react";

export default function NewEventPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizer Console
        </Link>
        <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">
          Organizer Event Wizard
        </span>
      </div>

      <CreateEventWizard />
    </div>
  );
}
