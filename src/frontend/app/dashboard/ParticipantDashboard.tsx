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
  LogOut,
  FolderGit2,
} from "lucide-react";
import ProjectSubmissionModal from "../projects/ProjectSubmissionModal";
import { AuthUser, logoutUser } from "../../lib/auth";

interface ParticipantDashboardProps {
  user?: AuthUser | null;
}

export default function ParticipantDashboard({ user }: ParticipantDashboardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner: Clean wide layout without sidebar */}
      <div className="card-modern p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                Participant Hub
              </span>
              <span className="text-xs font-mono text-slate-400">Team: Nightshift</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, {user?.name || "Ada Lovelace"}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Manage your project submission, track community upvotes, and review event criteria.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="btn-primary text-xs py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Submit New Project
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

      {/* Main Project & Team Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 card-modern p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Active Hackathon Submission</h2>
            </div>
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
              <h3 className="text-2xl font-black text-slate-900">{projectData.title}</h3>
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
              <h2 className="text-base font-bold text-slate-900">Team Nightshift</h2>
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
            Registered for <strong className="text-slate-700">Sample Hack 2026</strong>.
          </div>
        </div>
      </div>

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
