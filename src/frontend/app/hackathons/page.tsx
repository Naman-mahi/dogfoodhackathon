"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight, RotateCcw } from "lucide-react";
import { HACKATHONS_DATA } from "@/lib/mockData";

export default function HackathonsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrizeTier, setSelectedPrizeTier] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("soonest");

  const toggleFilter = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatuses([]);
    setSelectedFormats([]);
    setSelectedCategories([]);
    setSelectedPrizeTier("all");
    setSortBy("soonest");
  };

  const filteredHackathons = useMemo(() => {
    return HACKATHONS_DATA.filter((h) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = h.title.toLowerCase().includes(q);
        const matchesTagline = h.tagline.toLowerCase().includes(q);
        const matchesCat = h.categoryLabel.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTagline && !matchesCat) return false;
      }

      if (selectedStatuses.length > 0 && !selectedStatuses.includes(h.status)) {
        return false;
      }

      if (selectedFormats.length > 0 && !selectedFormats.includes(h.format)) {
        return false;
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(h.category)) {
        return false;
      }

      if (selectedPrizeTier === "under5k" && h.prizeAmount >= 5000) return false;
      if (selectedPrizeTier === "5k-25k" && (h.prizeAmount < 5000 || h.prizeAmount > 25000)) return false;
      if (selectedPrizeTier === "25k+" && h.prizeAmount < 25000) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "highestPrize") return b.prizeAmount - a.prizeAmount;
      if (sortBy === "mostParticipants") return b.participantCount - a.participantCount;
      const statusWeight = { live: 0, upcoming: 1, completed: 2 };
      return statusWeight[a.status] - statusWeight[b.status];
    });
  }, [searchQuery, selectedStatuses, selectedFormats, selectedCategories, selectedPrizeTier, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title - Clean Text, No Icon in Heading */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Explore Hackathons
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Discover competitions, form teams, and submit your builds for peer-reviewed evaluation.
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* LEFT SIDEBAR: Multiple Filters */}
        <aside className="card-modern p-6 space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Filters
            </h2>
            {(selectedStatuses.length > 0 ||
              selectedFormats.length > 0 ||
              selectedCategories.length > 0 ||
              selectedPrizeTier !== "all" ||
              searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keyword..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 1. Status Filter */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Status
            </span>
            <div className="space-y-1.5 text-xs text-slate-700">
              {[
                { id: "live", label: "Active / Live Now", dot: "bg-emerald-500 animate-pulse" },
                { id: "upcoming", label: "Upcoming / Open" },
                { id: "completed", label: "Past / Completed" },
              ].map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(s.id)}
                    onChange={() => toggleFilter(selectedStatuses, setSelectedStatuses, s.id)}
                    className="w-4 h-4 rounded-md text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1.5">
                    {s.dot && <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>}
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Format Filter */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Format
            </span>
            <div className="space-y-1.5 text-xs text-slate-700">
              {[
                { id: "online", label: "Online / Remote" },
                { id: "in-person", label: "In-Person" },
                { id: "hybrid", label: "Hybrid" },
              ].map((f) => (
                <label key={f.id} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes(f.id)}
                    onChange={() => toggleFilter(selectedFormats, setSelectedFormats, f.id)}
                    className="w-4 h-4 rounded-md text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Themes & Categories */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Categories
            </span>
            <div className="space-y-1.5 text-xs text-slate-700">
              {[
                { id: "ai", label: "Artificial Intelligence" },
                { id: "devtools", label: "DevTools & Infra" },
                { id: "web3", label: "Web3 & Blockchain" },
                { id: "opensource", label: "Open Source" },
                { id: "climate", label: "Climate & Health" },
              ].map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(c.id)}
                    onChange={() => toggleFilter(selectedCategories, setSelectedCategories, c.id)}
                    className="w-4 h-4 rounded-md text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Prize Pool */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Prize Pool
            </span>
            <div className="space-y-1.5 text-xs text-slate-700">
              {[
                { id: "all", label: "Any Amount" },
                { id: "under5k", label: "Under $5K" },
                { id: "5k-25k", label: "$5K – $25K" },
                { id: "25k+", label: "$25K+" },
              ].map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="prizeTier"
                    checked={selectedPrizeTier === p.id}
                    onChange={() => setSelectedPrizeTier(p.id)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT: Hackathons Grid */}
        <main className="lg:col-span-3 space-y-6">
          {/* Results Summary & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-modern px-5 py-3 shadow-xs">
            <span className="text-xs font-semibold text-slate-600">
              Showing <span className="font-bold text-slate-900">{filteredHackathons.length}</span> {filteredHackathons.length === 1 ? "hackathon" : "hackathons"}
            </span>

            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="sortSelect" className="font-medium text-slate-500">
                Sort by:
              </label>
              <select
                id="sortSelect"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="soonest">Soonest Deadline</option>
                <option value="highestPrize">Highest Prize</option>
                <option value="mostParticipants">Most Builders</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredHackathons.length === 0 ? (
            <div className="text-center py-16 card-modern p-8 space-y-4">
              <h3 className="text-base font-bold text-slate-800">No hackathons found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No events match your current filter selection. Try removing filters to view more opportunities.
              </p>
              <button
                onClick={handleResetFilters}
                className="btn-primary text-xs py-2 px-5"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredHackathons.map((h) => (
                <div
                  key={h.id}
                  className="card-modern overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Banner Area */}
                    <div className={`h-36 bg-gradient-to-tr ${h.gradient} relative p-4 flex flex-col justify-between text-white`}>
                      <div className="flex items-center justify-between">
                        <span
                          className={`badge-pill ${
                            h.status === "live"
                              ? "bg-emerald-500 text-white"
                              : h.status === "upcoming"
                              ? "bg-blue-500 text-white"
                              : "bg-slate-700/80 text-slate-300"
                          }`}
                        >
                          {h.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                          {h.status === "live" ? "Live Now" : h.status === "upcoming" ? "Registration Open" : "Completed"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-[10px] font-medium text-white/90">
                          {h.format.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs font-mono bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-lg w-fit">
                        {h.deadlineDisplay}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-3">
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                        {h.categoryLabel}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {h.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {h.tagline}
                      </p>

                      <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block">Prize Pool</span>
                          <span className="font-bold text-slate-800">{h.prizeDisplay}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Entry</span>
                          <span className="font-semibold text-emerald-600">{h.entryFeeDisplay}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Timezone</span>
                          <span className="font-medium text-slate-700">{h.timezone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Participants</span>
                          <span className="font-medium text-slate-700">{h.participantCount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="p-6 pt-0">
                    <Link
                      href={`/events?slug=${h.slug}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-xs"
                    >
                      View Event Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
