import React from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Globe,
} from "lucide-react";
import { fetchProjects, fetchProject } from "@/lib/api";
import ProjectSubmissionModal from "./ProjectSubmissionModal";
import LikeButton from "./LikeButton";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ slug?: string; id?: string; track?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const selectedProjectId = resolvedParams.slug || resolvedParams.id;
  const searchQuery = (resolvedParams.q || "").toLowerCase().trim();
  const selectedTrack = resolvedParams.track || "all";

  // Fetch live active project or project list from REST API
  const activeProject = selectedProjectId
    ? await fetchProject(selectedProjectId)
    : null;

  const filteredProjects = await fetchProjects({
    track: selectedTrack,
    q: searchQuery,
  });

  // Project Details Showcase View (if ?slug=... or ?id=... is selected)
  if (activeProject) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Link
          href="/projects"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects Gallery
        </Link>

        <div className="card-modern p-8 sm:p-10 shadow-sm space-y-8">
          <div className="space-y-3 border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="badge-pill bg-blue-50 text-blue-700 border border-blue-200">
                  {activeProject.trackLabel}
                </span>
                <Link
                  href={`/events?id=${activeProject.hackathonSlug || activeProject.hackathonId}`}
                  className="badge-pill bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Event: {activeProject.hackathonSlug || activeProject.hackathonId}
                </Link>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                slug: {activeProject.slug}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {activeProject.title}
              </h1>
              <LikeButton
                idOrSlug={activeProject.slug || activeProject.id}
                initialLikes={activeProject.likesCount}
              />
            </div>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {activeProject.summary}
            </p>

            <div className="pt-2 flex flex-wrap gap-6 text-xs text-slate-500">
              <div>
                <span className="font-semibold text-slate-700">Team: </span>
                {activeProject.team}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Submitted: </span>
                {new Date(activeProject.submittedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                The Problem
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeProject.problem}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                The Solution &amp; Architecture
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeProject.solution}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Technologies &amp; Libraries
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeProject.technologies.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
            {activeProject.repoUrl && (
              <a
                href={activeProject.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-6 py-3 rounded-full transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View Repository &rarr;
              </a>
            )}

            {activeProject.demoUrl && (
              <a
                href={activeProject.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-3 rounded-full transition-all shadow-sm"
              >
                <Globe className="w-4 h-4" />
                Live Demo &rarr;
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Projects Gallery View
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Project Gallery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Explore peer-evaluated submissions, architectures, and open-source prototypes.
          </p>
        </div>
        <ProjectSubmissionModal />
      </div>

      {/* Filter and Search Bar */}
      <form method="GET" action="/projects" className="card-modern p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            name="q"
            defaultValue={resolvedParams.q || ""}
            placeholder="Search projects, teams, tech..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-500 font-semibold">Track:</label>
            <select
              name="track"
              defaultValue={selectedTrack}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tracks</option>
              <option value="trk_01">DevTools &amp; Infra</option>
              <option value="trk_02">Data &amp; Calibration</option>
              <option value="trk_03">Zero-Trust &amp; Privacy</option>
              <option value="trk_04">Climate &amp; Energy</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary text-xs py-2 px-4 rounded-lg"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 card-modern p-8 space-y-4">
          <h3 className="text-base font-bold text-slate-800">No projects found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No projects match your current search query. Try broadening your keywords.
          </p>
          <Link
            href="/projects"
            className="btn-primary text-xs py-2 px-5 inline-block"
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="card-modern p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="badge-pill bg-blue-50 text-blue-600 border border-blue-200">
                    {p.trackLabel}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(p.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {p.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {p.summary}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <div>
                    Team: <span className="text-slate-800 font-semibold">{p.team}</span>
                  </div>
                  <LikeButton
                    idOrSlug={p.slug || p.id}
                    initialLikes={p.likesCount}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href={`/projects?slug=${p.slug || p.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-xs"
                >
                  View Architecture
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
