"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  LogOut,
  Sparkles,
  Trophy,
  ExternalLink,
} from "lucide-react";
import { AuthUser, logoutUser } from "../../lib/auth";
import { fetchEvents, fetchMyRegistrations, registerForEvent, unregisterFromEvent, isEventRegistrationOpen, EventData } from "../../lib/api";
import toast from "react-hot-toast";

interface ParticipantDashboardProps {
  user?: AuthUser | null;
}

export default function ParticipantDashboard({ user }: ParticipantDashboardProps) {
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch all events
    fetchEvents().then((evs) => {
      if (evs && evs.length > 0) setAllEvents(evs);
    });

    // 2. Fetch live registrations for current user
    fetchMyRegistrations().then((myEvents) => {
      if (myEvents && myEvents.length > 0) {
        const ids = myEvents.flatMap((e) => [e.id, e.slug]);
        setRegisteredEventIds(ids);
        if (user) {
          localStorage.setItem(`dogfood_registered_${user.user_id}`, JSON.stringify(ids));
        }
      } else if (user) {
        // Fallback to local cache
        const key = `dogfood_registered_${user.user_id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setRegisteredEventIds(parsed);
          } catch {}
        }
      }
    });
  }, [user]);

  const handleRegisterEvent = async (eventId: string) => {
    // Role verification: Only participants can register for hackathons
    if (user?.role && user.role !== "participant") {
      toast.error(`Only participants can register for hackathons. You are signed in as an '${user.role}'.`);
      return;
    }

    // Registration deadline check
    const ev = allEvents.find((e) => e.id === eventId || e.slug === eventId);
    if (ev) {
      const regStatus = isEventRegistrationOpen(ev);
      if (!regStatus.isOpen) {
        toast.error(`Registration for "${ev.title || ev.name}" has closed. ${regStatus.reason || ""}`);
        return;
      }
    }

    setLoadingActionId(eventId);
    try {
      const res = await registerForEvent(eventId);
      if (res.success) {
        const next = [...registeredEventIds, eventId];
        setRegisteredEventIds(next);
        if (user) {
          localStorage.setItem(`dogfood_registered_${user.user_id}`, JSON.stringify(next));
        }
        toast.success(res.message || "Registered successfully! Confirmation email sent.");
      } else {
        toast.error(res.error || "Failed to register for hackathon.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to register.");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleUnregisterEvent = async (eventId: string) => {
    setLoadingActionId(eventId);
    try {
      const res = await unregisterFromEvent(eventId);
      if (res.success) {
        const next = registeredEventIds.filter((id) => id !== eventId);
        setRegisteredEventIds(next);
        if (user) {
          localStorage.setItem(`dogfood_registered_${user.user_id}`, JSON.stringify(next));
        }
        toast.success("Unregistered from hackathon.");
      } else {
        toast.error(res.error || "Failed to unregister.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to unregister.");
    } finally {
      setLoadingActionId(null);
    }
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="card-modern p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold">
                Participant Portal
              </span>
              <span className="text-xs font-mono text-slate-400">
                {registeredEvents.length} Hackathon{registeredEvents.length !== 1 ? "s" : ""} Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {user?.name || "Participant"}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              View your registered hackathons, manage submissions, team invites, and track progress from each event's page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/hackathons"
              className="btn-primary text-xs py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Browse Events
            </Link>
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

      {/* My Hackathons */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              My Hackathons
              <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold ml-1">
                {registeredEvents.length} Registered
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click "View Hackathon" to manage submissions, your team, and track details.
            </p>
          </div>
          <Link
            href="/hackathons"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Browse All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {registeredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {registeredEvents.map((ev) => {
              const isClosed = ev.submissions_close
                ? new Date(ev.submissions_close) <= new Date()
                : false;
              const isUpcoming = ev.startDate
                ? new Date(ev.startDate) > new Date()
                : false;

              return (
                <div
                  key={ev.id}
                  className="card-modern p-6 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Category + Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-bold">
                        {ev.categoryLabel || ev.category}
                      </span>
                      {isUpcoming ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Upcoming
                        </span>
                      ) : isClosed ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Closed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      )}
                    </div>

                    {/* Title + Tagline */}
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {ev.title || ev.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {ev.tagline || "Hackathon challenge."}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 font-medium">Prize Pool</div>
                        <div className="font-bold text-slate-900 font-mono">
                          {ev.prizeDisplay || "$50,000"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 font-medium">Deadline</div>
                        <div className="font-mono text-slate-700 text-[10px]">
                          {ev.submissions_close
                            ? new Date(ev.submissions_close).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "TBD"}
                        </div>
                      </div>
                    </div>

                    {/* Track count */}
                    {ev.tracks && ev.tracks.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span>{ev.tracks.length} competition track{ev.tracks.length !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/hackathon/${ev.slug}?tab=overview`}
                      className="btn-primary text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 flex-1 justify-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Hackathon
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleUnregisterEvent(ev.id)}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors px-2 py-2"
                      title="Leave this hackathon"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center card-modern bg-slate-50 space-y-4 border border-dashed border-slate-300">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No hackathons yet</p>
              <p className="text-xs text-slate-400 mt-1">Browse and register for upcoming hackathons to get started.</p>
            </div>
            <Link href="/hackathons" className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              Browse Hackathons
            </Link>
          </div>
        )}
      </div>

      {/* Explore More */}
      {availableEvents.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Explore More Hackathons
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compete in multiple tracks across different events.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableEvents.slice(0, 6).map((ev) => (
              <div
                key={ev.id}
                className="card-modern p-5 bg-white border border-slate-200 hover:border-purple-200 flex flex-col justify-between space-y-3 group transition-all"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {ev.categoryLabel || ev.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {ev.title || ev.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{ev.tagline}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">
                    {ev.prizeDisplay || "$50,000"}
                  </span>
                  {!isEventRegistrationOpen(ev).isOpen ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded">
                      Registration Closed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRegisterEvent(ev.id)}
                      className="btn-primary text-xs py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 font-bold"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Register
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
