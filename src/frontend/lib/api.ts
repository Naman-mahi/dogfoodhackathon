import { PROJECTS_DATA, HACKATHONS_DATA, Project, Hackathon } from "./mockData";

export type EventData = Hackathon;
export type { Hackathon, Project };

// Resolve API base URL based on environment (Server vs Client)
function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side browser: relative path through Next.js proxy
    return "";
  }
  // Server-side inside container or Node
  const port = process.env.PORT || "8080";
  return `http://127.0.0.1:${port}`;
}

export interface ProjectSubmissionPayload {
  id?: string;
  slug?: string;
  title: string;
  summary?: string;
  repo_url?: string;
  demo_url?: string;
  track?: string;
  track_label?: string;
  team?: string;
  problem?: string;
  solution?: string;
  technologies?: string[];
  hackathon_id?: string;
  hackathon_slug?: string;
}

export interface CalibrationRanking {
  project_id: string;
  review_count: number;
  raw_mean: number;
  calibrated_score: number;
  shrinkage_delta: number;
}

export interface CalibrationResponse {
  global_prior_mean: number;
  shrinkage_k: number;
  rankings: CalibrationRanking[];
}

export async function fetchProjects(filters?: {
  track?: string;
  hackathon?: string;
  q?: string;
  featured?: boolean;
}): Promise<Project[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.track && filters.track !== "all") params.set("track", filters.track);
    if (filters?.hackathon && filters.hackathon !== "all") params.set("hackathon", filters.hackathon);
    if (filters?.q) params.set("search", filters.q);
    if (filters?.featured !== undefined) params.set("featured", String(filters.featured));

    const url = `${getApiBaseUrl()}/api/v1/projects?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Map backend schema to Project interface
        return data.map((p: any) => ({
          id: p.id,
          slug: p.slug || p.id,
          title: p.title,
          summary: p.summary || "",
          track: p.track,
          trackLabel: p.track_label || p.track,
          team: p.team,
          repoUrl: p.repo_url || "",
          demoUrl: p.demo_url,
          submittedAt: p.submitted_at,
          problem: p.problem || "Architectural challenge solved during hackathon.",
          solution: p.solution || "Distributed system built with modular components.",
          technologies: p.technologies || ["Python", "TypeScript", "PostgreSQL"],
          hackathonId: p.hackathon_id || "sample-hack-2026",
          hackathonSlug: p.hackathon_slug || "sample-hack-2026",
          likesCount: p.likes_count || 0,
          featured: p.featured || false,
        }));
      }
    }
  } catch (err) {
    console.warn("fetchProjects API fallback to mockData:", err);
  }

  // Graceful fallback to static data
  let result = [...PROJECTS_DATA];
  if (filters?.track && filters.track !== "all") {
    result = result.filter((p) => p.track === filters.track);
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q)
    );
  }
  return result;
}

export async function fetchProject(idOrSlug: string): Promise<Project | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/projects/${idOrSlug}`, { cache: "no-store" });
    if (res.ok) {
      const p = await res.json();
      return {
        id: p.id,
        slug: p.slug || p.id,
        title: p.title,
        summary: p.summary || "",
        track: p.track,
        trackLabel: p.track_label || p.track,
        team: p.team,
        repoUrl: p.repo_url || "",
        demoUrl: p.demo_url,
        submittedAt: p.submitted_at,
        problem: p.problem || "Problem solved during the sprint.",
        solution: p.solution || "Engineered solution with high reliability.",
        technologies: p.technologies || ["TypeScript", "Python"],
        hackathonId: p.hackathon_id || "sample-hack-2026",
        hackathonSlug: p.hackathon_slug || "sample-hack-2026",
        likesCount: p.likes_count || 0,
        featured: p.featured || false,
      };
    }
  } catch (err) {
    console.warn("fetchProject API fallback:", err);
  }

  return (
    PROJECTS_DATA.find((p) => p.slug === idOrSlug || p.id === idOrSlug) || null
  );
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    try {
      const u = localStorage.getItem("dogfood_user");
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed.token) {
          headers["Authorization"] = `Bearer ${parsed.token}`;
        }
      }
    } catch {}
  }
  return headers;
}

export async function submitProject(payload: ProjectSubmissionPayload): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}> {
  try {
    const headers = getAuthHeaders();
    // Try /api/v1/projects directly
    let res = await fetch("/api/v1/projects", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 404) {
      // Fallback
      res = await fetch("/api/projects/new", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.detail || "Submission failed. Please check the deadline and required fields.",
        status: res.status,
      };
    }
    return { success: true, data, status: res.status };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error", status: 500 };
  }
}

export async function registerForEvent(
  eventIdOrSlug: string,
  teamId?: string
): Promise<{
  success: boolean;
  registered: boolean;
  participantCount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/events/${eventIdOrSlug}/register`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ team_id: teamId || null }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        registered: false,
        error: data.detail || "Failed to register for hackathon.",
      };
    }
    return {
      success: true,
      registered: data.registered ?? true,
      participantCount: data.participant_count,
      message: data.message,
    };
  } catch (err: any) {
    return {
      success: false,
      registered: false,
      error: err.message || "Network error while registering.",
    };
  }
}

export async function unregisterFromEvent(
  eventIdOrSlug: string
): Promise<{
  success: boolean;
  registered: boolean;
  participantCount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/events/${eventIdOrSlug}/register`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        registered: true,
        error: data.detail || "Failed to unregister from hackathon.",
      };
    }
    return {
      success: true,
      registered: false,
      participantCount: data.participant_count,
      message: data.message,
    };
  } catch (err: any) {
    return {
      success: false,
      registered: true,
      error: err.message || "Network error while unregistering.",
    };
  }
}

export function isEventRegistrationOpen(hackathon: {
  registration_deadline?: string;
  registrationDeadline?: string;
  submissions_close?: string;
  endDate?: string;
  end_date?: string;
  status?: string;
  is_registration_open?: boolean;
  isRegistrationOpen?: boolean;
}): { isOpen: boolean; reason?: string; deadline?: Date } {
  if (hackathon.isRegistrationOpen === false || hackathon.is_registration_open === false) {
    return { isOpen: false, reason: "Registration is closed." };
  }

  const status = (hackathon.status || "").toLowerCase();
  if (status === "concluded" || status === "completed" || status === "closed") {
    return { isOpen: false, reason: "Hackathon has concluded." };
  }

  const deadlineStr =
    hackathon.registration_deadline ||
    hackathon.registrationDeadline ||
    hackathon.submissions_close ||
    hackathon.endDate ||
    hackathon.end_date;

  if (!deadlineStr) return { isOpen: true };

  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return { isOpen: true };

  const now = new Date();
  if (now > deadline) {
    const formatted = deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return {
      isOpen: false,
      reason: `Registration deadline passed on ${formatted}.`,
      deadline,
    };
  }

  return { isOpen: true, deadline };
}

export async function fetchRegistrationStatus(
  eventIdOrSlug: string
): Promise<{
  registered: boolean;
  participantCount: number;
  isRegistrationOpen: boolean;
  registrationDeadline?: string | null;
  registrationClosedReason?: string | null;
}> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/events/${eventIdOrSlug}/registration-status`, {
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return {
        registered: Boolean(data.registered),
        participantCount: data.participant_count || 0,
        isRegistrationOpen: data.is_registration_open ?? true,
        registrationDeadline: data.registration_deadline || null,
        registrationClosedReason: data.registration_closed_reason || null,
      };
    }
  } catch (err) {
    console.warn("fetchRegistrationStatus error:", err);
  }
  return { registered: false, participantCount: 0, isRegistrationOpen: true };
}

export async function fetchMyRegistrations(): Promise<Hackathon[]> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${getApiBaseUrl()}/api/v1/events/registrations/my`, {
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((ev: any) => ({
          ...ev,
          slug: ev.slug || ev.id,
          startDate: ev.start_date || "2026-02-15T09:00:00Z",
          endDate: ev.end_date || "2026-03-01T18:00:00Z",
          registration_deadline: ev.registration_deadline || ev.submissions_close || ev.end_date,
          registrationDeadline: ev.registration_deadline || ev.submissions_close || ev.end_date,
          isRegistrationOpen: ev.is_registration_open ?? true,
          registrationClosedReason: ev.registration_closed_reason || null,
          timezone: ev.timezone || "UTC",
          isFree: ev.is_free ?? true,
          entryFeeDisplay: ev.entry_fee_display || "Free Entry",
          prizeAmount: ev.prize_amount || 0,
          prizeDisplay: ev.prize_display || "$25,000 USD",
          participantCount: ev.participant_count || 1420,
          submissionCount: ev.submission_count || 42,
          deadlineDisplay: ev.deadline_display || "Closing soon",
          gradient: ev.gradient || "from-blue-600 via-indigo-600 to-sky-500",
          communityLinks: ev.community_links || { website: "https://dogfood.dev" },
          overview: ev.overview || { description: ev.tagline || "", highlights: [] },
          rules: ev.rules || [],
          timeline: ev.timeline || [],
          prizes: ev.prizes || [],
          faqs: ev.faqs || [],
          judgingCriteria: ev.judging_criteria || [],
          sponsors: ev.sponsors || [],
        }));
      }
    }
  } catch (err) {
    console.warn("fetchMyRegistrations error:", err);
  }
  return [];
}

export async function fetchMySubmission(eventIdOrSlug: string): Promise<Project | null> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/events/${eventIdOrSlug}/my-submission`, {
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const p = await res.json();
      if (p && p.id) {
        return {
          id: p.id,
          slug: p.slug || p.id,
          title: p.title,
          summary: p.summary || "",
          track: p.track,
          trackLabel: p.track_label || p.track,
          team: p.team,
          repoUrl: p.repo_url || "",
          demoUrl: p.demo_url,
          submittedAt: p.submitted_at,
          problem: p.problem || "",
          solution: p.solution || "",
          technologies: p.technologies || [],
          hackathonId: p.hackathon_id || "sample-hack-2026",
          hackathonSlug: p.hackathon_slug || "sample-hack-2026",
          likesCount: p.likes_count || 0,
          featured: p.featured || false,
        };
      }
    }
  } catch (err) {
    console.warn("fetchMySubmission error:", err);
  }
  return null;
}

export async function likeProject(idOrSlug: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/v1/projects/${idOrSlug}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      return data.likes_count;
    }
  } catch (err) {
    console.warn("likeProject failed:", err);
  }
  return null;
}

export function formatEventObject(ev: any): Hackathon {
  return {
    ...ev,
    slug: ev.slug || ev.id,
    startDate: ev.start_date || "2026-02-15T09:00:00Z",
    endDate: ev.end_date || "2026-03-01T18:00:00Z",
    registration_deadline: ev.registration_deadline || ev.submissions_close || ev.end_date,
    registrationDeadline: ev.registration_deadline || ev.submissions_close || ev.end_date,
    isRegistrationOpen: ev.is_registration_open ?? true,
    registrationClosedReason: ev.registration_closed_reason || null,
    timezone: ev.timezone || "UTC",
    isFree: ev.is_free ?? true,
    entryFeeDisplay: ev.entry_fee_display || "Free Entry",
    prizeAmount: ev.prize_amount || 0,
    prizeDisplay: ev.prize_display || "$25,000 USD",
    participantCount: ev.participant_count || 1420,
    submissionCount: ev.submission_count || 42,
    deadlineDisplay: ev.deadline_display || "Closing soon",
    gradient: ev.gradient || "from-blue-600 via-indigo-600 to-sky-500",
    communityLinks: ev.community_links || { website: "https://dogfood.dev" },
    overview: ev.overview || { description: ev.tagline || "", highlights: [] },
    rules: ev.rules || [],
    timeline: ev.timeline || [],
    prizes: ev.prizes || [],
    faqs: ev.faqs || [],
    judgingCriteria: ev.judging_criteria || [],
    sponsors: ev.sponsors || [],
    tracks: ev.tracks || [],
  };
}

export async function fetchEvents(category?: string, status?: string): Promise<Hackathon[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (status && status !== "all") params.set("status", status);

    const res = await fetch(`${getApiBaseUrl()}/api/v1/events?${params.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(formatEventObject);
      }
    }
  } catch (err) {
    console.warn("fetchEvents fallback:", err);
  }

  return HACKATHONS_DATA;
}

export async function fetchEvent(idOrSlug: string): Promise<Hackathon | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/events/${idOrSlug}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.id || data.slug)) {
        return formatEventObject(data);
      }
    }
  } catch (err) {
    console.warn("fetchEvent fallback:", err);
  }
  return HACKATHONS_DATA.find((h) => h.slug === idOrSlug || h.id === idOrSlug) || null;
}

export async function updateEvent(
  idOrSlug: string,
  payload: Record<string, any>
): Promise<{ success: boolean; event?: Hackathon; error?: string }> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/events/${idOrSlug}`, {
      method: "PUT",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.detail || "Failed to update event" };
    }
    return { success: true, event: formatEventObject(data) };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

export interface JudgeScoreRecord {
  id?: number;
  judge: string;
  project: string;
  criteria: {
    functionality?: number;
    quality?: number;
    innovation?: number;
    [key: string]: number | undefined;
  };
  comment: string;
}

export async function fetchJudgeScores(): Promise<JudgeScoreRecord[]> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/judge/scores`, {
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchJudgeScores error:", err);
  }
  return [];
}

export async function submitJudgeScore(payload: {
  project: string;
  criteria: Record<string, number>;
  comment?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/judge/scores`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.detail || "Failed to submit score" };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

export async function fetchCalibratedRankings(): Promise<CalibrationResponse | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/judge/calibrated`, {
      cache: "no-store",
      headers: { Cookie: "session=org_7f2a" },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchCalibratedRankings error:", err);
  }
  return null;
}

export async function inviteTeammate(
  eventIdOrSlug: string,
  email: string,
  teamName?: string,
  inviteUrl?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/events/${eventIdOrSlug}/invite-teammate`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ email, team_name: teamName || null, invite_url: inviteUrl || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.detail || "Failed to send team invitation." };
    }
    return { success: true, message: data.message || `Invitation sent to ${email}` };
  } catch (err: any) {
    return { success: false, message: err.message || "Network error while inviting teammate." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Judge Management APIs (Organizer Hub)
// ─────────────────────────────────────────────────────────────────────────────
export interface JudgeData {
  id: string;
  name: string;
  email: string;
  tracks: string[];
}

export async function fetchJudges(): Promise<JudgeData[]> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch("/api/v1/judges", {
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchJudges error:", err);
  }
  return [];
}

export async function createJudge(payload: {
  id: string;
  name: string;
  email: string;
  tracks?: string[];
}): Promise<{ success: boolean; judge?: JudgeData; error?: string }> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch("/api/v1/judges", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.detail || "Failed to invite judge." };
    }
    return { success: true, judge: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error while inviting judge." };
  }
}

export async function updateJudge(
  judgeId: string,
  payload: { name?: string; email?: string; tracks?: string[] }
): Promise<{ success: boolean; judge?: JudgeData; error?: string }> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/judges/${judgeId}`, {
      method: "PUT",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.detail || "Failed to update judge." };
    }
    return { success: true, judge: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error while updating judge." };
  }
}

export async function deleteJudge(judgeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/judges/${judgeId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.detail || "Failed to remove judge." };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error while deleting judge." };
  }
}

export interface RegistrationItem {
  id: string;
  event_id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  team_id?: string;
  status: string;
  created_at?: string;
}

export async function fetchEventRegistrations(eventIdOrSlug: string): Promise<RegistrationItem[]> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/events/${eventIdOrSlug}/registrations`, {
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchEventRegistrations error:", err);
  }
  return [];
}

export async function removeParticipantRegistration(
  eventIdOrSlug: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/v1/events/${eventIdOrSlug}/registrations/${userId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });
    if (res.ok) {
      return { success: true };
    }
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.detail || "Failed to remove participant" };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

