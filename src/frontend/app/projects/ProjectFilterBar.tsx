"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Shuffle } from "lucide-react";
import Select2 from "@/components/Select2";

interface ProjectFilterBarProps {
  initialTrack?: string;
  initialQuery?: string;
  initialSort?: string;
}

const TRACK_OPTIONS = [
  { value: "all", label: "All Tracks" },
  { value: "trk_01", label: "DevTools & Infra" },
  { value: "trk_02", label: "Data & Calibration" },
  { value: "trk_03", label: "Zero-Trust & Privacy" },
  { value: "trk_04", label: "Climate & Energy" },
];

export default function ProjectFilterBar({
  initialTrack = "all",
  initialQuery = "",
  initialSort = "latest",
}: ProjectFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTrackChange = (val: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (val && val !== "all") {
      params.set("track", val);
    } else {
      params.delete("track");
    }
    router.push(`/projects?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string) || "";
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    router.push(`/projects?${params.toString()}`);
  };

  const toggleShuffle = () => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    const newSort = initialSort === "random" ? "latest" : "random";
    params.set("sort", newSort);
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <div className="card-modern p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
      <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search projects, teams, tech..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        <div className="flex items-center gap-2 text-xs min-w-[200px]">
          <span className="text-slate-500 font-semibold shrink-0">Track:</span>
          <div className="w-full">
            <Select2
              variant="light"
              value={initialTrack}
              onChange={handleTrackChange}
              options={TRACK_OPTIONS}
              isSearchable={false}
              placeholder="All Tracks"
            />
          </div>
        </div>

        {/* Anti-Bias Shuffle Sort Toggle */}
        <button
          type="button"
          onClick={toggleShuffle}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
            initialSort === "random"
              ? "bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-300/40"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Shuffle className="w-3.5 h-3.5 text-purple-600" />
          <span>{initialSort === "random" ? "Randomized (Anti-Bias)" : "Anti-Bias Shuffle"}</span>
        </button>
      </div>
    </div>
  );
}
