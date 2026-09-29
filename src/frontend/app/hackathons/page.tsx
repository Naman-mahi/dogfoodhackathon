"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, RotateCcw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { fetchEvents, fetchMyRegistrations, registerForEvent, unregisterFromEvent, isEventRegistrationOpen, Hackathon } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import Select2 from "@/components/Select2";

export default function HackathonsPage() {
  const router = useRouter();
  const [hackathonsList, setHackathonsList] = useState<Hackathon[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrizeTier, setSelectedPrizeTier] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("soonest");

  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch live events from backend
    fetchEvents()
      .then((evs) => {
        setHackathonsList(evs || []);
      })
      .catch((err) => {
        console.error("Failed to load live hackathons:", err);
        setHackathonsList([]);
      })
      .finally(() => setLoadingEvents(false));

    // 2. Fetch user's registered events from backend API
    const user = getStoredUser();
    if (user) {
      fetchMyRegistrations().then((myEvs) => {
        if (myEvs && myEvs.length > 0) {
          const ids = myEvs.flatMap((e) => [e.id, e.slug]);
          setRegisteredEventIds(ids);
          localStorage.setItem(`dogfood_registered_${user.user_id}`, JSON.stringify(ids));
        } else {
          // Check local cache as fallback
          const saved = localStorage.getItem(`dogfood_registered_${user.user_id}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) setRegisteredEventIds(parsed);
            } catch {}
          }
        }
      });
    }
  }, []);

  const handleToggleRegister = async (h: Hackathon) => {
    const user = getStoredUser();
    if (!user) {
      toast.error("Please sign in to register for hackathons");
      router.push(`/login?redirect=/hackathons`);
      return;
    }

    // Role verification: Only participants can register for hackathons
    if (user.role && user.role !== "participant") {
      toast.error(`Only participants can register for hackathons. You are signed in as an '${user.role}'.`);
      return;
    }

    const isReg = registeredEventIds.includes(h.id) || registeredEventIds.includes(h.slug);

    // Registration deadline check
    if (!isReg) {
      const regState = isEventRegistrationOpen(h);
      if (!regState.isOpen) {
        toast.error(`Registration for "${h.title}" is closed. ${regState.reason || ""}`);
        return;
      }
    }

    setRegisteringId(h.id);

    try {
      if (isReg) {
        // Unregister
        const res = await unregisterFromEvent(h.id);
        if (res.success) {
          const next = registeredEventIds.filter((id) => id !== h.id && id !== h.slug);
          setRegisteredEventIds(next);
          localStorage.setItem(`dogfood_registered_${user.user_id}`, JSON.stringify(next));

          // Update participant count in place
          setHackathonsList((prev) =>
            prev.map((item) =>
              item.id === h.id || item.slug === h.slug
                ? { ...item, participantCount: res.participantCount ?? Math.max(0, item.participantCount - 1) }
                : item
            )
          );
          toast(`Unregistered from ${h.title}`, { icon: "👋" });
        } else {
          toast.error(res.error || "Failed to unregister.");
        }
      } else {
        // Register
        const res = await registerForEvent(h.id);
        if (res.success) {
          const next = [...registeredEventIds, h.id, h.slug];
          setRegisteredEventIds(next);
          localStorage.setItem(`dogfood_registered_${user.user_id}`, JSON.stringify(next));

          // Update participant count in place
          setHackathonsList((prev) =>
            prev.map((item) =>
              item.id === h.id || item.slug === h.slug
                ? { ...item, participantCount: res.participantCount ?? (item.participantCount + 1) }
                : item
            )
          );
          toast.success(`Successfully registered for ${h.title}! Confirmation email sent ✉️`);
        } else {
          toast.error(res.error || "Registration failed.");
        }
      }
    } finally {
      setRegisteringId(null);
    }
  };

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
    return hackathonsList.filter((h) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (h.title || h.name || "").toLowerCase().includes(q);
        const matchesTagline = (h.tagline || "").toLowerCase().includes(q);
        const matchesCat = (h.categoryLabel || h.category || "").toLowerCase().includes(q);
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

      const prize = h.prizeAmount || 0;
      if (selectedPrizeTier === "under5k" && prize >= 5000) return false;
      if (selectedPrizeTier === "5k-25k" && (prize < 5000 || prize > 25000)) return false;
      if (selectedPrizeTier === "25k+" && prize < 25000) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "highestPrize") return (b.prizeAmount || 0) - (a.prizeAmount || 0);
      if (sortBy === "mostParticipants") return (b.participantCount || 0) - (a.participantCount || 0);
      const statusWeight: Record<string, number> = { live: 0, upcoming: 1, completed: 2 };
      const weightA = statusWeight[a.status] ?? 3;
      const weightB = statusWeight[b.status] ?? 3;
      return weightA - weightB;
    });
  }, [hackathonsList, searchQuery, selectedStatuses, selectedFormats, selectedCategories, selectedPrizeTier, sortBy]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
              <label htmlFor="sortSelect" className="font-medium text-slate-500 shrink-0">
                Sort by:
              </label>
              <div className="w-44">
                <Select2
                  variant="light"
                  id="sortSelect"
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: "soonest", label: "Soonest Deadline" },
                    { value: "highestPrize", label: "Highest Prize" },
                    { value: "mostParticipants", label: "Most Builders" },
                  ]}
                  isSearchable={false}
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card-modern h-96 animate-pulse bg-slate-100/70" />
              ))}
            </div>
          ) : filteredHackathons.length === 0 ? (
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
              {filteredHackathons.map((h) => {
                const regState = isEventRegistrationOpen(h);
                const isReg = registeredEventIds.includes(h.id) || registeredEventIds.includes(h.slug);
                const formattedRegDeadline = regState.deadline
                  ? regState.deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : h.deadlineDisplay;

                return (
                  <div
                    key={h.id}
                    className="card-modern overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Banner Area */}
                      <div className={`h-36 bg-gradient-to-tr ${h.gradient || "from-blue-600 via-indigo-600 to-sky-500"} relative p-4 flex flex-col justify-between text-white`}>
                        <div className="flex items-center justify-between">
                          <span
                            className={`badge-pill ${
                              !regState.isOpen
                                ? "bg-rose-600/90 text-white"
                                : h.status === "live"
                                ? "bg-emerald-500 text-white"
                                : h.status === "upcoming"
                                ? "bg-blue-500 text-white"
                                : "bg-slate-700/80 text-slate-300"
                            }`}
                          >
                            {!regState.isOpen ? (
                              "Registration Closed"
                            ) : (
                              <>
                                {h.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                                {h.status === "live" ? "Live Now" : "Registration Open"}
                              </>
                            )}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-[10px] font-medium text-white/90">
                            {(h.format || "online").toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                            {h.deadlineDisplay || "Ongoing"}
                          </span>
                          {!regState.isOpen && (
                            <span className="bg-rose-950/70 text-rose-200 border border-rose-500/30 px-2 py-0.5 rounded text-[10px]">
                              Closed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 space-y-3">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                          {h.categoryLabel || (h.category ? h.category.toUpperCase() : "General")}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {h.title || "Untitled Hackathon"}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {h.tagline || ""}
                        </p>

                        <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block">Prize Pool</span>
                            <span className="font-bold text-slate-800">{h.prizeDisplay || (h.prizeAmount ? `$${h.prizeAmount.toLocaleString()} USD` : "Open Pool")}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Entry</span>
                            <span className="font-semibold text-emerald-600">{h.entryFeeDisplay || (h.isFree ? "Free Entry" : "$0")}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Registration</span>
                            <span className={`font-semibold ${regState.isOpen ? "text-emerald-600" : "text-rose-600"}`}>
                              {regState.isOpen ? "Open" : "Closed"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Last Date</span>
                            <span className="font-medium text-slate-700 truncate block" title={formattedRegDeadline}>
                              {formattedRegDeadline}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Action */}
                    <div className="p-6 pt-0 flex gap-2">
                      <Link
                        href={`/events?slug=${h.slug}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-xs"
                      >
                        Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        disabled={registeringId === h.id || (!isReg && !regState.isOpen)}
                        onClick={() => handleToggleRegister(h)}
                        className={`text-xs px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isReg
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                            : !regState.isOpen
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                        } ${registeringId === h.id ? "opacity-60 cursor-wait" : ""}`}
                      >
                        {registeringId === h.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isReg ? (
                          "Registered ✓"
                        ) : !regState.isOpen ? (
                          "Closed"
                        ) : (
                          "Register"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
