"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Code,
  Users,
  Clock,
  Heart,
  ExternalLink,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Send,
  LogOut,
  FolderGit2,
  Calendar,
  Sparkles,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import ProjectSubmissionModal from "../projects/ProjectSubmissionModal";
import { AuthUser, logoutUser } from "../../lib/auth";
import { fetchEvents, EventData } from "../../lib/api";

interface ParticipantDashboardProps {
  user?: AuthUser | null;
}

export default function ParticipantDashboard({ user }: ParticipantDashboardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([
    "sample-hack-2026",
    "ai-builder-sprint-2026",
  ]);

  const [projectData, setProjectData] = useState({
    title: "Quiet Hours",
    team: "Nightshift",
    track: "Developer tools",
    summary: "Autonomous notification silencer during active deep work.",
    problem: "Context switching ruins developer productivity during critical build hours.",
    solution: "Autonomous notification silencer and calendar protector.",
    repoUrl: "https://example.org/repo",
    likes: 18,
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load events dynamically
    fetchEvents().then((evs) => {
      if (evs && evs.length > 0) {
        setAllEvents(evs);
      }
    });

    // Load registered event IDs from localStorage if available
    const key = `dogfood_registered_${user?.user_id || "prt_01"}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRegisteredEventIds(parsed);
        }
      } catch {
        // use default
      }
    }
  }, [user]);

  const handleRegisterEvent = (eventId: string) => {
    const next = registeredEventIds.includes(eventId)
      ? registeredEventIds
      : [...registeredEventIds, eventId];
    setRegisteredEventIds(next);
    const key = `dogfood_registered_${user?.user_id || "prt_01"}`;
    localStorage.setItem(key, JSON.stringify(next));
  };

  const handleUnregisterEvent = (eventId: string) => {
    const next = registeredEventIds.filter((id) => id !== eventId);
    setRegisteredEventIds(next);
    const key = `dogfood_registered_${user?.user_id || "prt_01"}`;
    localStorage.setItem(key, JSON.stringify(next));
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage("NOTICE: Submissions deadline (2026-03-01T18:00:00Z) is closed. Project modifications are locked (HTTP 4xx refused).");
    setTimeout(() => {
      setIsEditModalOpen(false);
    }, 2000);
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/login";
  };

  const registeredEvents = allEvents.filter(
    (ev) => registeredEventIds.includes(ev.id) || registeredEventIds.includes(ev.slug)
  );

  const availableEvents = allEvents.filter(
    (ev) => !registeredEventIds.includes(ev.id) && !registeredEventIds.includes(ev.slug)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Header Banner: Clean wide layout without sidebar */}
      <div className="card-modern p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold">
                Participant Portal
              </span>
              <span className="text-xs font-mono text-slate-400">Team: Nightshift</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, {user?.name || "Ada Lovelace"}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Manage your project submissions, track registered hackathons, and review deadlines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="btn-primary text-xs py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Project
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary text-xs py-2.5 px-3.5 text-slate-200 border-slate-700 bg-slate-800/80 hover:bg-slate-700 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: REGISTERED HACKATHONS (Multiple Events Support) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              My Registered Hackathons
              <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold ml-1">
                {registeredEvents.length} Active
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              All hackathons you are currently participating in across the platform.
            </p>
          </div>

          <Link
            href="/hackathons"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Browse All Hackathons <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {registeredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {registeredEvents.map((ev) => {
              const isClosed = ev.submissions_close
                ? new Date(ev.submissions_close) <= new Date()
                : true;

              return (
                <div
                  key={ev.id}
                  className="card-modern p-6 bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-bold">
                        {ev.categoryLabel || ev.category}
                      </span>
                      {isClosed ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Submissions Closed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Submissions Open
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900">{ev.title || ev.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {ev.tagline || "Autonomous developer evaluation challenge."}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Prize Pool:</span>
                        <span className="font-bold text-slate-900">{ev.prizeDisplay || "$50,000"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Deadline:</span>
                        <span className="font-mono text-slate-700">
                          {ev.submissions_close ? new Date(ev.submissions_close).toLocaleDateString() : "2026-03-01"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Submission:</span>
                        <span className="font-bold text-emerald-700">
                          {ev.id === "sample-hack-2026" || ev.id === "evt_01"
                            ? "Quiet Hours (Submitted)"
                            : "Draft in progress"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="btn-primary text-xs py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Submit Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnregisterEvent(ev.id)}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      Leave Event
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center card-modern bg-slate-50 space-y-3">
            <p className="text-xs text-slate-500">You are not registered for any hackathons yet.</p>
            <Link href="/hackathons" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
              Browse & Register for Hackathons
            </Link>
          </div>
        )}
      </div>

      {/* SECTION 2: ACTIVE PROJECT DETAILS & DEADLINE NOTICES */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-600" />
            Active Hackathon Submission
          </h2>
          <p className="text-xs text-slate-500">
            Project entry submitted for <strong className="text-slate-700">Sample Hack 2026</strong>.
          </p>
        </div>

        {/* Deadline Refusal Alert (Tier 1 Requirement) */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Submissions Window Closed (2026-03-01T18:00:00Z)</div>
            <div className="text-amber-800/90 text-[11px] leading-relaxed">
              In compliance with DOGFOOD 2026 Tier 1 specifications, the submissions deadline has elapsed. The portal strictly refuses new submissions and edits with HTTP 4xx errors.
            </div>
          </div>
        </div>

        {/* Project & Team Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Details */}
          <div className="lg:col-span-2 card-modern p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Project Details</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Project
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-2xl font-black text-slate-900">{projectData.title}</h4>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                  Track: {projectData.track}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {projectData.summary}
              </p>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Target Problem
                  </span>
                  <span className="text-xs text-slate-700 mt-1 block leading-relaxed">
                    {projectData.problem}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Engineered Solution
                  </span>
                  <span className="text-xs text-slate-700 mt-1 block leading-relaxed">
                    {projectData.solution}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-2">
                <a
                  href={projectData.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
                  Git Repository
                </a>
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                  <Heart className="w-3.5 h-3.5 fill-rose-600" />
                  {projectData.likes} Community Likes
                </div>
              </div>
            </div>
          </div>

          {/* Team Nightshift Card */}
          <div className="card-modern p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Team Nightshift</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-bold">
                tm_01
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  AL
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Ada Lovelace (Lead)</div>
                  <div className="text-[10px] text-slate-500">ada@example.org</div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 leading-relaxed">
              Active participant in <strong className="text-slate-700">Sample Hack 2026</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: EXPLORE & REGISTER FOR MORE HACKATHONS */}
      {availableEvents.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Explore & Register for Upcoming Hackathons
              </h2>
              <p className="text-xs text-slate-500">
                Join additional hackathons to build and compete in multiple tracks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableEvents.slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                className="card-modern p-5 bg-white border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {ev.categoryLabel || ev.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{ev.title || ev.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{ev.tagline}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">{ev.prizeDisplay || "$50,000"}</span>
                  <button
                    type="button"
                    onClick={() => handleRegisterEvent(ev.id)}
                    className="btn-primary text-xs py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 font-bold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Project Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-modern max-w-lg w-full p-6 bg-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Project Details</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {saveMessage && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                {saveMessage}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={projectData.title}
                  onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Problem</label>
                <textarea
                  rows={2}
                  value={projectData.problem}
                  onChange={(e) => setProjectData({ ...projectData, problem: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Solution</label>
                <textarea
                  rows={2}
                  value={projectData.solution}
                  onChange={(e) => setProjectData({ ...projectData, solution: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary text-xs py-2">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Submission Modal */}
      <ProjectSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        showButton={false}
      />
    </div>
  );
}
