"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Code2, Sparkles, Copy, Check } from "lucide-react";
import { fetchProjects, fetchEvents, Project } from "@/lib/api";

function EmbedProjectsContent() {
  const searchParams = useSearchParams();
  const hackathonParam = searchParams.get("hackathon") || searchParams.get("event") || "";
  const limitParam = parseInt(searchParams.get("limit") || "6", 10);
  const themeParam = searchParams.get("theme") || "light";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [eventTitle, setEventTitle] = useState<string>("Hackathon Showcase");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [allProjects, events] = await Promise.all([
          fetchProjects({ eventId: hackathonParam || undefined }),
          fetchEvents(),
        ]);

        if (hackathonParam) {
          const matchedEvent = events.find(
            (e) => e.slug === hackathonParam || e.id === hackathonParam
          );
          if (matchedEvent) {
            setEventTitle(matchedEvent.title || matchedEvent.name);
          }
        }

        // Only show submitted projects in public embed
        const submitted = allProjects.filter((p) => p.status !== "draft");
        setProjects(submitted.slice(0, limitParam > 0 ? limitParam : 6));
      } catch (err) {
        console.error("Failed to load embedded projects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [hackathonParam, limitParam]);

  const copyEmbedSnippet = () => {
    if (typeof window === "undefined") return;
    const currentUrl = window.location.href;
    const iframeCode = `<iframe src="${currentUrl}" width="100%" height="650" style="border:none;border-radius:12px;overflow:hidden;" title="DOGFOOD Project Showcase"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDark = themeParam === "dark";

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 transition-colors font-sans ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Embed Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Sparkles className="w-3 h-3" />
              Live Showcase
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {projects.length} Project{projects.length === 1 ? "" : "s"}
            </span>
          </div>
          <h1 className="text-xl font-black mt-1 tracking-tight">
            {eventTitle}
          </h1>
        </div>

        {/* Copy Embed Snippet Pill */}
        <button
          onClick={copyEmbedSnippet}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            copied
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 shadow-sm"
          }`}
          title="Copy <iframe> snippet to embed this live gallery"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied <iframe>!" : "Embed Code"}</span>
        </button>
      </div>

      {/* Grid of Projects */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
          {[1, 2, 3, 4, 5, 6].slice(0, limitParam).map((i) => (
            <div
              key={i}
              className={`rounded-2xl p-5 animate-pulse border ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800 mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">No submitted projects found for this showcase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`group flex flex-col justify-between rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg ${
                isDark
                  ? "bg-slate-900/90 border-slate-800 hover:border-blue-600/50"
                  : "bg-white border-slate-200/90 hover:border-blue-300 shadow-sm"
              }`}
            >
              <div>
                {/* Banner / Visual Placeholder */}
                <div className="h-28 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-4 flex flex-col justify-between text-white relative overflow-hidden mb-4">
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                      {project.track || "Open Innovation"}
                    </span>
                    {project.status && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/80 text-white">
                        ✓ Submitted
                      </span>
                    )}
                  </div>
                  <div className="z-10 font-bold text-sm tracking-tight truncate">
                    {project.team_name || project.teamName || "Team"}
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
                </div>

                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {project.description || project.summary || "No description provided."}
                </p>
              </div>

              {/* Card Footer / Links */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(project.repo_url || project.repoUrl) && (
                    <a
                      href={project.repo_url || project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Source Repository"
                    >
                      <Code2 className="w-4 h-4" />
                    </a>
                  )}
                  {(project.demo_url || project.demoUrl) && (
                    <a
                      href={project.demo_url || project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                      title="Live Demo"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <a
                  href={`/projects?id=${project.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 group/btn"
                >
                  <span>View Project</span>
                  <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Powered By DOGFOOD branding */}
      <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Powered by <strong className="text-slate-600 dark:text-slate-300 font-bold">DOGFOOD 2026</strong> Evaluation Platform</span>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors"
        >
          dogfood.internal ↗
        </a>
      </div>
    </div>
  );
}

export default function EmbedProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-400">
          Loading showcase...
        </div>
      }
    >
      <EmbedProjectsContent />
    </Suspense>
  );
}

