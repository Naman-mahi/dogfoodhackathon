"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export default function CreateEventWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State across the 5 steps
  const [eventData, setEventData] = useState({
    name: "",
    slug: "",
    tagline: "",
    category: "devtools",
    category_label: "Developer Tools",
    format: "online",
    location: "Global · Online",
    host: "DOGFOOD Foundation",
    start_date: "2026-10-01T09:00",
    end_date: "2026-10-15T18:00",
    submissions_close: "2026-10-14T23:59",
    timezone: "UTC",
    prize_amount: 50000,
    prize_display: "$50,000 in Bounties",
    team_size_limit: "1-4 Members",
    level: "All Experience Levels",
    tracks: [
      { id: "trk_01", name: "Core Architecture & Performance", prize: "$25,000" },
      { id: "trk_02", name: "AI Agent & Evaluation Pipeline", prize: "$25,000" },
    ],
    rubrics: [
      { title: "Functionality & Correctness", weight: "40%", description: "Code functions reliably." },
      { title: "Code Quality & Clean Design", weight: "30%", description: "Clean abstractions, tests." },
      { title: "Innovation & Originality", weight: "30%", description: "Novel architecture or approach." },
    ],
  });

  const handleAddTrack = () => {
    const nextIdx = eventData.tracks.length + 1;
    setEventData((prev) => ({
      ...prev,
      tracks: [
        ...prev.tracks,
        { id: `trk_0${nextIdx}`, name: `New Track ${nextIdx}`, prize: "$10,000" },
      ],
    }));
  };

  const handleRemoveTrack = (index: number) => {
    setEventData((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((_, i) => i !== index),
    }));
  };

  const handleTrackChange = (index: number, field: string, value: string) => {
    setEventData((prev) => {
      const updated = [...prev.tracks];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, tracks: updated };
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
        prize_amount: Number(eventData.prize_amount) || 0,
        prize_display: eventData.prize_display,
        host: eventData.host,
        team_size_limit: eventData.team_size_limit,
        level: eventData.level,
        start_date: new Date(eventData.start_date).toISOString(),
        end_date: new Date(eventData.end_date).toISOString(),
        submissions_close: new Date(eventData.submissions_close).toISOString(),
        timezone: eventData.timezone,
        judging_criteria: eventData.rubrics,
      };

      const res = await fetch("/api/v1/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "session=org_7f2a",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to publish event.");
      }

      setSuccessMsg(`Hackathon "${eventData.name}" created and published successfully!`);
      setTimeout(() => {
        router.push("/hackathons");
      }, 1500);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Step Progress Bar */}
      <div className="card-modern p-4 sm:p-6 bg-white shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Step {step} of 5</span>
          <span className="text-purple-600 uppercase font-mono tracking-wider">
            {step === 1 && "Basic Information"}
            {step === 2 && "Timeline & Deadlines"}
            {step === 3 && "Tracks & Bounties"}
            {step === 4 && "Rubric & Evaluation"}
            {step === 5 && "Review & Publish"}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-full flex-1 transition-all ${
                step >= s ? "bg-purple-600" : "bg-transparent"
              } ${s < 5 ? "border-r border-white/50" : ""}`}
            />
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
            <h2 className="text-xl font-black text-slate-900">Event Identity & Details</h2>
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
                <select
                  value={eventData.category}
                  onChange={(e) =>
                    setEventData({
                      ...eventData,
                      category: e.target.value,
                      category_label: e.target.options[e.target.selectedIndex].text,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="devtools">Developer Tools</option>
                  <option value="ai">Artificial Intelligence</option>
                  <option value="web3">Web3 & Decentralized</option>
                  <option value="opensource">Open Source Infrastructure</option>
                  <option value="climate">Climate & Clean Tech</option>
                </select>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location & Format</label>
                <input
                  type="text"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={!eventData.name.trim()}
              onClick={() => setStep(2)}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
            >
              Continue to Timeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Timeline & Deadlines */}
      {step === 2 && (
        <div className="card-modern p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Event Timeline & Deadlines</h2>
            <p className="text-xs text-slate-500">
              Configure submission cut-off dates. Remember that Tier 1 strictly refuses submissions past deadline.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hackathon Kickoff (Start)</label>
                <input
                  type="datetime-local"
                  value={eventData.start_date}
                  onChange={(e) => setEventData({ ...eventData, start_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Conclusion (End)</label>
                <input
                  type="datetime-local"
                  value={eventData.end_date}
                  onChange={(e) => setEventData({ ...eventData, end_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submissions Deadline (Strict Cut-off)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={eventData.submissions_close}
                  onChange={(e) => setEventData({ ...eventData, submissions_close: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-rose-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
                <input
                  type="text"
                  value={eventData.timezone}
                  onChange={(e) => setEventData({ ...eventData, timezone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
            >
              Continue to Tracks & Bounties <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Tracks & Prizes */}
      {step === 3 && (
        <div className="card-modern p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Tracks & Prize Pool</h2>
            <p className="text-xs text-slate-500">Configure competition tracks and prize pool distributions.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Prize Amount ($)</label>
              <input
                type="number"
                value={eventData.prize_amount}
                onChange={(e) => setEventData({ ...eventData, prize_amount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prize Display Text</label>
              <input
                type="text"
                value={eventData.prize_display}
                onChange={(e) => setEventData({ ...eventData, prize_display: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Dynamic Tracks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Competition Tracks
              </label>
              <button
                type="button"
                onClick={handleAddTrack}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Track
              </button>
            </div>

            {eventData.tracks.map((trk, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <input
                  type="text"
                  value={trk.id}
                  onChange={(e) => handleTrackChange(idx, "id", e.target.value)}
                  placeholder="trk_01"
                  className="w-20 bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono"
                />
                <input
                  type="text"
                  value={trk.name}
                  onChange={(e) => handleTrackChange(idx, "name", e.target.value)}
                  placeholder="Track Title"
                  className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
                <input
                  type="text"
                  value={trk.prize}
                  onChange={(e) => handleTrackChange(idx, "prize", e.target.value)}
                  placeholder="Prize"
                  className="w-24 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold"
                />
                {eventData.tracks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
            >
              Continue to Rubric <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Rubric & Criteria */}
      {step === 4 && (
        <div className="card-modern p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Judging Rubric & Weights</h2>
            <p className="text-xs text-slate-500">
              Establish scoring dimensions for blind peer evaluations (Tier 2 requirement).
            </p>
          </div>

          <div className="space-y-3">
            {eventData.rubrics.map((r, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">{r.title}</span>
                  <span className="text-xs font-bold text-purple-600 font-mono">{r.weight}</span>
                </div>
                <p className="text-xs text-slate-500">{r.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
            >
              Preview & Publish <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Publish */}
      {step === 5 && (
        <div className="card-modern p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Review & Publish Event</h2>
            <p className="text-xs text-slate-500">Review the generated event card before publishing to the platform.</p>
          </div>

          {/* Event Preview Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950 text-white shadow-lg space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full">
                {eventData.category_label}
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {eventData.prize_display}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black">{eventData.name || "Untitled Hackathon"}</h3>
              <p className="text-xs text-slate-300 mt-1">{eventData.tagline}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Submissions Close</span>
                <span>{new Date(eventData.submissions_close).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Format</span>
                <span className="capitalize">{eventData.format}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Tracks</span>
                <span>{eventData.tracks.length} Tracks</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitEvent}
              className="btn-primary text-xs py-3 px-8 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing Event...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Publish Hackathon
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
