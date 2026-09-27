"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import ProjectSubmissionModal from "../projects/ProjectSubmissionModal";

export default function ParticipantDashboard() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [projectData, setProjectData] = useState({
    title: "Quiet Hours",
    team: "Nightshift",
    track: "Developer tools",
    summary: "One line notification silencer during active deep work.",
    problem: "Context switching ruins developer productivity during critical build hours.",
    solution: "Autonomous notification silencer and calendar protector.",
    repoUrl: "https://example.org/repo",
    likes: 18,
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate deadline refusal warning
    setSaveMessage("NOTICE: Submissions deadline (2026-03-01T18:00:00Z) is closed. Project modifications are locked.");
    setTimeout(() => {
      setIsEditModalOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="card-modern p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                Tier 1 Participant Portal
              </span>
              <span className="text-xs font-mono text-slate-400">Team: Nightshift</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Participant Dashboard</h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Manage your team, track community engagement, and monitor hackathon project status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Submit New Project
          </button>
        </div>
      </div>

      {/* Deadline Notice (T1) */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Submissions Window Closed (2026-03-01T18:00:00Z)</div>
          <div className="text-amber-800/90 text-[11px] leading-relaxed">
            In compliance with DOGFOOD 2026 Tier 1 requirements, the submissions deadline has elapsed. The portal will refuse new project submissions and edits with HTTP 4xx.
          </div>
        </div>
      </div>

      {/* Main Project Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Project Overview */}
        <div className="lg:col-span-2 card-modern p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Your Hackathon Submission</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Project
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">{projectData.title}</h3>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                {projectData.track}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{projectData.summary}</p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Problem</span>
                <span className="text-xs text-slate-700">{projectData.problem}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Solution</span>
                <span className="text-xs text-slate-700">{projectData.solution}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <a
                href={projectData.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Repository
              </a>
              <div className="flex items-center gap-1 text-xs text-rose-600 font-bold">
                <Heart className="w-3.5 h-3.5 fill-rose-600" />
                {projectData.likes} Community Likes
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Team Information */}
        <div className="card-modern p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Team Nightshift</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">tm_01</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                AL
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Ada Lovelace (Lead)</div>
                <div className="text-[10px] text-slate-500">ada@example.org</div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            Registered for <strong className="text-slate-700">Sample Hack 2026</strong>.
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
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

      {/* New Project Submission Modal */}
      <ProjectSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        showButton={false}
      />
    </div>
  );
}
