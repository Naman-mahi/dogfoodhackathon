"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Scale,
  Award,
  Globe,
} from "lucide-react";
import { HACKATHONS_DATA } from "@/lib/mockData";

function EventsContent() {
  const searchParams = useSearchParams();
  const eventIdentifier =
    searchParams.get("slug") || searchParams.get("id") || "sample-hack-2026";
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  // Find the hackathon by slug or id, fallback to the first one
  const hackathon =
    HACKATHONS_DATA.find(
      (h) => h.slug === eventIdentifier || h.id === eventIdentifier
    ) || HACKATHONS_DATA[0];

  const formattedStartDate = new Date(hackathon.startDate).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
  const formattedEndDate = new Date(hackathon.endDate).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Event Header Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                hackathon.status === "live"
                  ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300"
                  : hackathon.status === "upcoming"
                  ? "bg-blue-500/20 border border-blue-400/30 text-blue-300"
                  : "bg-slate-500/20 border border-slate-400/30 text-slate-300"
              }`}
            >
              {hackathon.status === "live" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
              {hackathon.status === "live"
                ? "Live Hackathon"
                : hackathon.status === "upcoming"
                ? "Upcoming Event"
                : "Completed Event"}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium">
              {hackathon.location}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium">
              {hackathon.categoryLabel}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            slug: {hackathon.slug}
          </span>
        </div>

        {/* Clean Main Heading without icons */}
        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {hackathon.title}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {hackathon.tagline}
          </p>
        </div>

        {/* Quick Key Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-800">
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-white">
              {hackathon.prizeDisplay}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Prize Pool
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-white">
              {hackathon.entryFeeDisplay}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Entry Type
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-white">
              {hackathon.participantCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Registered
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-white">
              {hackathon.submissionCount > 0
                ? `${hackathon.submissionCount} Builds`
                : "Open"}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Submissions
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-white">
              {hackathon.timezone}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Timezone
            </div>
          </div>
          <div className="space-y-1">
            <div
              className={`text-xl sm:text-2xl font-black ${
                hackathon.status === "live"
                  ? "text-emerald-400"
                  : hackathon.status === "upcoming"
                  ? "text-blue-400"
                  : "text-slate-400"
              }`}
            >
              {hackathon.status === "live"
                ? "Active"
                : hackathon.status === "upcoming"
                ? "Opening Soon"
                : "Concluded"}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Stage
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-3 rounded-full transition-all shadow-md shadow-blue-600/30"
          >
            Browse Submissions in Gallery
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-6 py-3 rounded-full transition-all"
          >
            Register as Builder
          </Link>
          <Link
            href="/hackathons"
            className="text-slate-400 hover:text-white font-semibold text-xs px-4 py-3 rounded-full transition-all"
          >
            View All Hackathons
          </Link>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Overview" },
            { id: "rules", label: "Rules & Eligibility" },
            { id: "schedule", label: "Track Timeline & Schedule" },
            { id: "prizes", label: "Prizes & Honors" },
            { id: "faq", label: "FAQ" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="card-modern p-6 sm:p-10 shadow-xs">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">
                About {hackathon.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {hackathon.overview.description}
              </p>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              {hackathon.overview.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <h3 className="font-bold text-sm text-slate-900">
                    {highlight.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Competition Tracks */}
            {hackathon.tracks && hackathon.tracks.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Competition Tracks
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose one or more specialized tracks to focus your build.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {hackathon.tracks.map((track) => (
                    <div
                      key={track.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                            {track.prize}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {track.name}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {track.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Specifications */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Event Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Dates</span>
                  <span className="font-semibold text-slate-800">
                    {formattedStartDate} — {formattedEndDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Timezone</span>
                  <span className="font-semibold text-slate-800">
                    {hackathon.timezone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Host &amp; Organizer</span>
                  <span className="font-semibold text-slate-800">
                    {hackathon.host}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Entry Fee</span>
                  <span className="font-semibold text-slate-800">
                    {hackathon.entryFeeDisplay} (
                    {hackathon.isFree ? "100% Free" : "Registration Required"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Experience Level</span>
                  <span className="font-semibold text-slate-800">
                    {hackathon.level}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Team Limit</span>
                  <span className="font-semibold text-slate-800">
                    {hackathon.teamSizeLimit}
                  </span>
                </div>
              </div>
            </div>

            {/* Sponsors & Ecosystem Partners */}
            {hackathon.sponsors && hackathon.sponsors.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Sponsors &amp; Ecosystem Partners
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {hackathon.sponsors.map((sponsor, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white text-center space-y-1 shadow-xs"
                    >
                      <div className="font-bold text-sm text-slate-900">
                        {sponsor.name}
                      </div>
                      <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                        {sponsor.tier}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Judges Panel */}
            {hackathon.judges && hackathon.judges.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Judging Panel &amp; Evaluators
                  </h3>
                  <p className="text-xs text-slate-500">
                    Domain experts and research engineers performing isolated evaluations.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {hackathon.judges.map((judge) => (
                    <div
                      key={judge.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                    >
                      <div className="font-bold text-sm text-slate-900">
                        {judge.name}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {judge.role}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Assigned tracks: {judge.tracks?.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Links */}
            {hackathon.communityLinks && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Community &amp; Resources
                </h3>
                <div className="flex flex-wrap gap-3">
                  {hackathon.communityLinks.website && (
                    <a
                      href={hackathon.communityLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Official Website
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}
                  {hackathon.communityLinks.discord && (
                    <a
                      href={hackathon.communityLinks.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Community Discord
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}
                  {hackathon.communityLinks.github && (
                    <a
                      href={hackathon.communityLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      GitHub Organization
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-6 py-2.5 rounded-full transition-all"
              >
                View Submitted Projects
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-full transition-all"
              >
                Join Hackathon
              </Link>
            </div>
          </div>
        )}

        {/* TAB 2: RULES & ELIGIBILITY */}
        {activeTab === "rules" && (
          <div className="space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Rules &amp; Eligibility
              </h2>
              {hackathon.eligibilitySummary && (
                <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/70 border border-blue-200 p-4 rounded-2xl text-blue-950 font-medium">
                  {hackathon.eligibilitySummary}
                </p>
              )}
            </div>

            {/* Eligibility quick bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex flex-wrap gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-400 font-normal">Level: </span>
                {hackathon.level}
              </div>
              <div>
                <span className="text-slate-400 font-normal">Team Limit: </span>
                {hackathon.teamSizeLimit}
              </div>
              <div>
                <span className="text-slate-400 font-normal">Fee: </span>
                {hackathon.entryFeeDisplay}
              </div>
              <div>
                <span className="text-slate-400 font-normal">Timezone: </span>
                {hackathon.timezone}
              </div>
            </div>

            {/* Judging Criteria */}
            {hackathon.judgingCriteria && hackathon.judgingCriteria.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Judging &amp; Evaluation Criteria
                  </h3>
                  <p className="text-xs text-slate-500">
                    All projects are evaluated against standard calibration rubrics.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hackathon.judgingCriteria.map((criterion, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900">
                          {criterion.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                          {criterion.weight}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {criterion.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules items */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Participation Rules
              </h3>
              <div className="space-y-4">
                {hackathon.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      {rule.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEDICATED TRACK TIMELINE & SCHEDULE UI */}
        {activeTab === "schedule" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Track Timeline &amp; Schedule
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Key milestones and deadlines for {hackathon.title} ({hackathon.timezone}).
              </p>
            </div>

            {/* TIMELINE PROGRESS COMPONENT */}
            <div className="relative pt-4 pb-2">
              {/* Vertical connector line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200"></div>

              <div className="space-y-8 relative">
                {hackathon.timeline.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-start gap-4 group"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 ${
                        milestone.status === "completed"
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : milestone.status === "active"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-100 animate-pulse"
                          : "bg-slate-100 border border-slate-200 text-slate-400"
                      }`}
                    >
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : milestone.status === "active" ? (
                        <Clock className="w-6 h-6" />
                      ) : (
                        <span className="font-mono text-xs font-bold">
                          {milestone.phase.slice(-1)}
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex-1 rounded-2xl p-5 space-y-2 transition-all ${
                        milestone.status === "active"
                          ? "bg-blue-50/40 border-2 border-blue-500 shadow-xs"
                          : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`badge-pill ${
                            milestone.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : milestone.status === "active"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {milestone.status === "active" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          )}
                          {milestone.statusLabel}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          {milestone.timestamp}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {milestone.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRIZES & HONORS */}
        {activeTab === "prizes" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Prizes &amp; Honors
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Total prize pool of {hackathon.prizeDisplay} sponsored by {hackathon.host}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {hackathon.prizes.map((prize, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-6 text-center space-y-2 shadow-xs border ${
                    idx === 0
                      ? "border-amber-200 bg-amber-50/50"
                      : idx === 1
                      ? "border-slate-200 bg-slate-50"
                      : "border-orange-200 bg-orange-50/50"
                  }`}
                >
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      idx === 0
                        ? "text-amber-700 bg-amber-100/60"
                        : idx === 1
                        ? "text-slate-700 bg-slate-200"
                        : "text-orange-700 bg-orange-100/60"
                    }`}
                  >
                    {prize.place}
                  </span>
                  <div className="font-black text-2xl text-slate-900 pt-1">
                    {prize.amount}
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    {prize.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {prize.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FAQ */}
        {activeTab === "faq" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3 text-xs sm:text-sm">
              {hackathon.faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-5 rounded-2xl border border-slate-200 space-y-1"
                >
                  <h3 className="font-bold text-slate-900">{faq.question}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading event details...
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
