"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Layers,
  Award,
  Sparkles,
  Sliders,
  Globe,
  Loader2,
  DollarSign,
  Users,
  Clock,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Select2 from "@/components/Select2";

export default function CreateEventWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query param synchronization for step: ?step=1..5
  const stepParam = parseInt(searchParams?.get("step") || "1", 10);
  const [step, setStep] = useState(stepParam >= 1 && stepParam <= 5 ? stepParam : 1);

  useEffect(() => {
    const s = parseInt(searchParams?.get("step") || "1", 10);
    if (s >= 1 && s <= 5 && s !== step) {
      setStep(s);
    }
  }, [searchParams]);

  const changeStep = (nextStep: number) => {
    if (nextStep > step) {
      if (step === 1 && !eventData.name.trim()) {
        toast.error("Please enter a valid hackathon name.");
        return;
      }
      if (step === 2 && new Date(eventData.end_date) <= new Date(eventData.start_date)) {
        toast.error("Hackathon end date must be after the start date.");
        return;
      }
      if (step === 3 && eventData.tracks.length === 0) {
        toast.error("At least one competition track is required.");
        return;
      }
    }
    const clamped = Math.min(Math.max(1, nextStep), 5);
    setStep(clamped);
    router.push(`/events/new?step=${clamped}`);
  };

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State across the 5 steps
  const [eventData, setEventData] = useState({
    name: "Autonomous AI & Systems Sprint 2026",
    slug: "ai-systems-sprint-2026",
    tagline: "Build next-generation multi-agent systems and offline evaluation appliances.",
    category: "devtools",
    category_label: "Developer Tools",
    format: "online",
    location: "Global · Online",
    host: "DOGFOOD Foundation",
    start_date: "2026-10-01T09:00",
    end_date: "2026-10-20T18:00",
    submissions_close: "2026-10-18T23:59",
    timezone: "UTC",
    prize_amount: 60000,
    prize_display: "$60,000 in Bounties",
    team_size_limit: "1-4 Members",
    level: "All Experience Levels",
    tracks: [
      { id: `trk_${Math.random().toString(36).slice(2, 10)}`, name: "Core Architecture & Performance", prize: "$30,000" },
      { id: `trk_${Math.random().toString(36).slice(2, 10)}`, name: "AI Agent & Evaluation Pipeline", prize: "$20,000" },
      { id: `trk_${Math.random().toString(36).slice(2, 10)}`, name: "Offline Resilience & Edge Sync", prize: "$10,000" },
    ],
    rubrics: [
      { title: "Functionality & Correctness", weight: "40%", description: "Code functions reliably with automated test passes." },
      { title: "Code Quality & Clean Design", weight: "30%", description: "Clean abstractions, minimal dependencies, documented architecture." },
      { title: "Innovation & Originality", weight: "30%", description: "Novel problem solving or breakthrough speedup." },
    ],
  });

  // Dynamic Live KPIs Calculations
  const totalTrackPrizes = eventData.tracks.reduce((sum, trk) => {
    const num = parseInt(trk.prize.replace(/[^0-9]/g, "") || "0", 10);
    return sum + num;
  }, 0);
  const effectivePrizePool = totalTrackPrizes > 0 ? totalTrackPrizes : Number(eventData.prize_amount) || 0;

  const startMs = new Date(eventData.start_date).getTime();
  const subCloseMs = new Date(eventData.submissions_close).getTime();
  const endMs = new Date(eventData.end_date).getTime();
  const sprintDurationHours = Math.max(0, Math.round((subCloseMs - startMs) / (1000 * 60 * 60)));
  const sprintDurationDays = (sprintDurationHours / 24).toFixed(1);
  const reviewWindowHours = Math.max(0, Math.round((endMs - subCloseMs) / (1000 * 60 * 60)));

  const maxTeamMembers = parseInt(eventData.team_size_limit.split("-")[1] || "4", 10) || 4;
  const projectedTeams = Math.max(10, eventData.tracks.length * 25);
  const projectedParticipants = projectedTeams * maxTeamMembers;
  const judgesNeeded = Math.max(3, Math.ceil((projectedTeams * 3) / 10)); // 3 peer-blind reviews per project, max 10 projects/judge

  const totalRubricWeight = eventData.rubrics.reduce((sum, r) => {
    return sum + parseInt(r.weight.replace(/[^0-9]/g, "") || "0", 10);
  }, 0);

  const handleAddTrack = () => {
    setEventData((prev) => ({
      ...prev,
      tracks: [
        ...prev.tracks,
        { id: `trk_${Math.random().toString(36).slice(2, 10)}`, name: `New Innovation Track ${prev.tracks.length + 1}`, prize: "$10,000" },
      ],
    }));
    toast.success("Competition track added.");
  };

  const handleRemoveTrack = (index: number) => {
    setEventData((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((_, i) => i !== index),
    }));
    toast.success("Track removed.");
  };

  const handleTrackChange = (index: number, field: string, value: string) => {
    setEventData((prev) => {
      const updated = [...prev.tracks];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, tracks: updated };
    });
  };

  const handleAddRubric = () => {
    setEventData((prev) => ({
      ...prev,
      rubrics: [
        ...prev.rubrics,
        { title: "New Evaluation Criterion", weight: "20%", description: "Clear standard for assessment." },
      ],
    }));
    toast.success("Evaluation criterion added.");
  };

  const handleRemoveRubric = (index: number) => {
    setEventData((prev) => ({
      ...prev,
      rubrics: prev.rubrics.filter((_, i) => i !== index),
    }));
    toast.success("Evaluation criterion removed.");
  };

  const handleRubricChange = (index: number, field: string, value: string) => {
    setEventData((prev) => {
      const updated = [...prev.rubrics];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, rubrics: updated };
    });
  };

  const handleSubmitEvent = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const slug =
        eventData.slug.trim() ||
        eventData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const payload = {
        name: eventData.name,
        title: eventData.name,
        slug: slug,
        tagline: eventData.tagline,
        status: "upcoming",
        format: eventData.format,
        category: eventData.category,
        category_label: eventData.category_label,
        location: eventData.location,
        prize_amount: effectivePrizePool,
        prize_display: `$${effectivePrizePool.toLocaleString()} USD`,
        host: eventData.host,
        team_size_limit: eventData.team_size_limit,
        level: eventData.level,
        start_date: new Date(eventData.start_date).toISOString(),
        end_date: new Date(eventData.end_date).toISOString(),
        submissions_close: new Date(eventData.submissions_close).toISOString(),
        timezone: eventData.timezone,
        judging_criteria: eventData.rubrics,
        tracks: eventData.tracks,
      };

      // Read the real session token from the logged-in user
      let authHeaders: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const storedUser = JSON.parse(localStorage.getItem("dogfood_user") || "{}");
        if (storedUser?.token) {
          authHeaders["Authorization"] = `Bearer ${storedUser.token}`;
        }
      } catch { /* no-op */ }

      const res = await fetch("/api/v1/events", {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to publish event.");
      }

      const msg = `Hackathon "${eventData.name}" created and published successfully!`;
      setSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => {
        router.push("/hackathons");
      }, 1500);
    } catch (e: any) {
      const err = e.message || "Failed to create event.";
      setErrorMsg(err);
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Real-time Dynamic KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-white text-slate-800 rounded-2xl shadow-xs border border-slate-200">
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase font-bold text-purple-600 tracking-wider flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Prize Budget
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
            ${effectivePrizePool.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500">
            {eventData.tracks.length} active tracks
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" /> Projected Capacity
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {projectedParticipants}
          </div>
          <div className="text-[10px] text-slate-500">
            ~{projectedTeams} squads ({maxTeamMembers}/team)
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Sprint Duration
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {sprintDurationDays}d
          </div>
          <div className="text-[10px] text-slate-500">
            {sprintDurationHours} active build hrs
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] uppercase font-bold text-amber-600 tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Review Window
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {reviewWindowHours}h
          </div>
          <div className="text-[10px] text-slate-500">
            Post-lock evaluation
          </div>
        </div>

        <div className="space-y-0.5 col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase font-bold text-rose-600 tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Review Capacity
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {judgesNeeded} Judges
          </div>
          <div className="text-[10px] text-slate-500">
            3x peer isolation redundancy
          </div>
        </div>
      </div>

      {/* Step Progress Bar - Clickable Tabs Synchronized with URL ?step=1..5 */}
      <div className="card-modern p-4 sm:p-5 bg-white shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <span>Step {step} of 5</span>
            <span className="text-purple-600 uppercase font-mono tracking-wider font-extrabold">
              {step === 1 && "Identity & Format"}
              {step === 2 && "Timeline & Deadlines"}
              {step === 3 && "Tracks & Bounties"}
              {step === 4 && "Judging Rubrics"}
              {step === 5 && "Review & Publish"}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">URL param: ?step={step}</span>
        </div>

        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {[
            { s: 1, label: "Identity" },
            { s: 2, label: "Schedule" },
            { s: 3, label: "Tracks" },
            { s: 4, label: "Rubrics" },
            { s: 5, label: "Publish" },
          ].map(({ s, label }) => (
            <button
              key={s}
              type="button"
              onClick={() => changeStep(s)}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                step === s
                  ? "bg-purple-600 text-white shadow-xs"
                  : step > s
                  ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {s}. {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: Basic Information */}
      {step === 1 && (
        <div className="card-modern p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Event Identity & Branding</h2>
            <p className="text-xs text-slate-500">Define the core branding, format, and category of the hackathon.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hackathon Name</label>
              <input
                type="text"
                required
                value={eventData.name}
                onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                placeholder="e.g. Autonomous AI Builder Sprint 2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={eventData.slug}
                  onChange={(e) => setEventData({ ...eventData, slug: e.target.value })}
                  placeholder="e.g. ai-builder-sprint-2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <Select2
                  variant="light"
                  value={eventData.category}
                  onChange={(val) => {
                    const labelMap: Record<string, string> = {
                      devtools: "Developer Tools",
                      ai: "Artificial Intelligence",
                      web3: "Web3 & Decentralized",
                      opensource: "Open Source Infrastructure",
                      climate: "Climate & Clean Tech",
                    };
                    setEventData({
                      ...eventData,
                      category: val,
                      category_label: labelMap[val] || val,
                    });
                  }}
                  options={[
                    { value: "devtools", label: "Developer Tools" },
                    { value: "ai", label: "Artificial Intelligence" },
                    { value: "web3", label: "Web3 & Decentralized" },
                    { value: "opensource", label: "Open Source Infrastructure" },
                    { value: "climate", label: "Climate & Clean Tech" },
                  ]}
                  isSearchable={true}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">One-Line Tagline</label>
              <input
                type="text"
                value={eventData.tagline}
                onChange={(e) => setEventData({ ...eventData, tagline: e.target.value })}
                placeholder="e.g. Build cutting-edge autonomous agents and distributed consensus protocols."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hosting Organization</label>
                <input
                  type="text"
                  value={eventData.host}
                  onChange={(e) => setEventData({ ...eventData, host: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Format</label>
                <Select2
                  variant="light"
                  value={eventData.format}
                  onChange={(val) => setEventData({ ...eventData, format: val })}
                  options={[
                    { value: "online", label: "Online / Virtual" },
                    { value: "in-person", label: "In-Person Venue" },
                    { value: "hybrid", label: "Hybrid (Global + Regional Hubs)" },
                  ]}
                  isSearchable={false}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => changeStep(2)}
              className="btn-primary text-xs py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              Next: Schedule & Deadlines <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Schedule & Timelines */}
      {step === 2 && (
        <div className="card-modern p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Sprint Timeline & Deadlines</h2>
            <p className="text-xs text-slate-500">Configure key milestone timestamps. Submissions lock automatically when the deadline elapses.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sprint Start Date</label>
                <input
                  type="datetime-local"
                  required
                  value={eventData.start_date}
                  onChange={(e) => setEventData({ ...eventData, start_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submissions Lock Deadline
                  <span className="text-rose-500 ml-1 font-bold">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={eventData.submissions_close}
                  onChange={(e) => setEventData({ ...eventData, submissions_close: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 border-rose-300 bg-rose-50/30"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Hard lock: projects refuse edits after this instant.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judging & Event End Date</label>
                <input
                  type="datetime-local"
                  required
                  value={eventData.end_date}
                  onChange={(e) => setEventData({ ...eventData, end_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Timezone</label>
                <input
                  type="text"
                  value={eventData.timezone}
                  onChange={(e) => setEventData({ ...eventData, timezone: e.target.value })}
                  placeholder="UTC, PST, EST, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team Size Limit</label>
                <Select2
                  variant="light"
                  value={eventData.team_size_limit}
                  onChange={(val) => setEventData({ ...eventData, team_size_limit: val })}
                  options={[
                    { value: "1-2 Members", label: "1 - 2 Members (Pair Programming)" },
                    { value: "1-4 Members", label: "1 - 4 Members (Standard Squad)" },
                    { value: "1-5 Members", label: "1 - 5 Members (Expanded Team)" },
                    { value: "Solo Only", label: "Solo Builders Only" },
                  ]}
                  isSearchable={false}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => changeStep(3)}
              className="btn-primary text-xs py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              Next: Tracks & Bounties <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Tracks & Bounties */}
      {step === 3 && (
        <div className="card-modern p-6 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Tracks & Prize Bounties</h2>
              <p className="text-xs text-slate-500">
                Prizes auto-sum into the total dynamic prize pool (${effectivePrizePool.toLocaleString()}).
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTrack}
              className="btn-secondary text-xs py-2 px-3.5 text-purple-700 border-purple-200 hover:bg-purple-50 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Track
            </button>
          </div>

          <div className="space-y-4">
            {eventData.tracks.map((trk, idx) => (
              <div
                key={trk.id || idx}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                    Track #{idx + 1}
                  </span>
                  {eventData.tracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTrack(idx)}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Track Name</label>
                    <input
                      type="text"
                      required
                      value={trk.name}
                      onChange={(e) => handleTrackChange(idx, "name", e.target.value)}
                      placeholder="e.g. Distributed State & Zero-Knowledge"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Prize Bounty</label>
                    <input
                      type="text"
                      required
                      value={trk.prize}
                      onChange={(e) => handleTrackChange(idx, "prize", e.target.value)}
                      placeholder="$25,000"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => changeStep(2)}
              className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => changeStep(4)}
              className="btn-primary text-xs py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              Next: Rubrics & Evaluation <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Rubric & Evaluation */}
      {step === 4 && (
        <div className="card-modern p-6 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Judging Rubrics & Weight Calibration</h2>
              <p className="text-xs text-slate-500">
                Criteria used by assigned judges during isolated peer reviews. Current total:{" "}
                <span className={`font-mono font-bold ${totalRubricWeight === 100 ? "text-emerald-600" : "text-amber-600"}`}>
                  {totalRubricWeight}%
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddRubric}
              className="btn-secondary text-xs py-2 px-3.5 text-purple-700 border-purple-200 hover:bg-purple-50 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Criterion
            </button>
          </div>

          {totalRubricWeight !== 100 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Weights currently sum to {totalRubricWeight}%. Recommended total is 100%.</span>
            </div>
          )}

          <div className="space-y-4">
            {eventData.rubrics.map((rubric, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Criterion #{idx + 1}
                  </span>
                  {eventData.rubrics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRubric(idx)}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Criterion Title</label>
                    <input
                      type="text"
                      required
                      value={rubric.title}
                      onChange={(e) => handleRubricChange(idx, "title", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Weight</label>
                    <input
                      type="text"
                      required
                      value={rubric.weight}
                      onChange={(e) => handleRubricChange(idx, "weight", e.target.value)}
                      placeholder="30%"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Scoring Description & Instructions</label>
                  <input
                    type="text"
                    value={rubric.description}
                    onChange={(e) => handleRubricChange(idx, "description", e.target.value)}
                    placeholder="Specific questions evaluators should grade against."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => changeStep(3)}
              className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => changeStep(5)}
              className="btn-primary text-xs py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              Next: Review &amp; Publish <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Publish */}
      {step === 5 && (
        <div className="card-modern p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Review &amp; Publish Hackathon</h2>
            <p className="text-xs text-slate-500">Confirm parameters before deploying the event live to the platform.</p>
          </div>

          {/* Event Preview Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950 text-white shadow-lg space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full font-bold">
                {eventData.category_label}
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                ${effectivePrizePool.toLocaleString()} USD
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black">{eventData.name || "Untitled Hackathon"}</h3>
              <p className="text-xs text-slate-300 mt-1">{eventData.tagline}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 pt-3 border-t border-slate-800">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Submissions Lock</span>
                <span className="font-mono text-emerald-300">{new Date(eventData.submissions_close).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Format</span>
                <span className="capitalize">{eventData.format}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Tracks</span>
                <span>{eventData.tracks.length} Categories</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Host</span>
                <span>{eventData.host}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => changeStep(4)}
              className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitEvent}
              className="btn-primary text-xs py-3 px-8 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-md shadow-purple-600/20 font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying Hackathon...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Publish Hackathon Live
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
