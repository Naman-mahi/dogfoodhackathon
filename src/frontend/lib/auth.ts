"use client";

export interface AuthUser {
  user_id: string;
  id?: string;
  email: string;
  name: string;
  role: "organizer" | "judge" | "participant" | string;
  avatar_url?: string;
  token?: string;
  bio?: string;
  github_handle?: string;
}

export const TEST_PERSONAS: Record<string, {
  name: string;
  email: string;
  password: string;
  role: "admin" | "organizer" | "judge" | "participant";
  description: string;
  badge: string;
}> = {
  admin: {
    name: "System Administrator",
    email: "admin@dogfood.internal",
    password: "demo2026",
    role: "admin",
    description: "Global root access, manage users, promote roles, view system telemetry",
    badge: "Admin",
  },
  organizer: {
    name: "DOGFOOD Organizer",
    email: "organizer@dogfood.dev",
    password: "demo2026",
    role: "organizer",
    description: "Manage events, rubric weights, inspect judge progress, export CSV",
    badge: "Organizer",
  },
  judge_a: {
    name: "Tomas Varga (Judge A)",
    email: "tomas.varga@example.org",
    password: "demo2026",
    role: "judge",
    description: "Evaluate track submissions blindly with isolated rubrics",
    badge: "Judge A",
  },
  judge_b: {
    name: "Wei Lindqvist (Judge B)",
    email: "wei.lindqvist@example.org",
    password: "demo2026",
    role: "judge",
    description: "Evaluate peer submissions blindly without cross-judge visibility",
    badge: "Judge B",
  },
  participant: {
    name: "Ada Lovelace",
    email: "ada@example.org",
    password: "demo2026",
    role: "participant",
    description: "Manage team projects, edit details, track likes & submission status",
    badge: "Participant",
  },
};

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export function setSessionCookie(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `session=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function clearSessionCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "session=; path=/; max-age=0; SameSite=Lax";
  }
}

// ─── LocalStorage helpers (non-sensitive display data only) ──────────────────

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem("dogfood_user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  // Store only display-safe data in localStorage (no sensitive tokens)
  const { token, ...displayData } = user;
  localStorage.setItem("dogfood_user", JSON.stringify(displayData));
  // Token goes only into cookie (HttpOnly-safe via backend; client sets via JS for demo)
  if (token) {
    setSessionCookie(token);
  }
  window.dispatchEvent(new CustomEvent("dogfood_auth_change", { detail: displayData }));
}

export function updateStoredUser(updates: Partial<AuthUser>) {
  if (typeof window === "undefined") return;
  const current = getStoredUser();
  if (current) {
    const updated = { ...current, ...updates };
    localStorage.setItem("dogfood_user", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("dogfood_auth_change", { detail: updated }));
  }
}

// ─── Core Auth Functions (all hit the backend) ───────────────────────────────

export async function loginWithCredentials(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Authentication failed. Check your email and password.");
  }

  const data = await res.json();
  const user: AuthUser = {
    user_id: data.user_id,
    email: data.email,
    name: data.name || email.split("@")[0].toUpperCase(),
    role: data.role,
    avatar_url: data.avatar_url,
    token: data.token || data.access_token,
  };

  saveStoredUser(user);
  return user;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password?: string;
  role?: string;
  github_handle?: string;
}): Promise<AuthUser> {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Registration failed");
  }

  const data = await res.json();
  const user: AuthUser = {
    user_id: data.user_id,
    email: data.email,
    name: data.name || payload.name,
    role: data.role,
    avatar_url: data.avatar_url,
    token: data.token || data.access_token,
  };

  saveStoredUser(user);
  return user;
}

export async function socialLogin(
  provider: "google" | "github" | "linkedin",
  customRole?: string
): Promise<AuthUser> {
  // Generate realistic demo identity for the provider (demo environment only)
  const seed = Math.random().toString(36).substring(7);
  let name = "";
  let email = "";

  if (provider === "google") {
    name = "Alex Rivera";
    email = `alex.rivera.${seed}@gmail.com`;
  } else if (provider === "github") {
    name = "Jordan Dev";
    email = `jordan.builds.${seed}@users.noreply.github.com`;
  } else {
    name = "Taylor Morgan";
    email = `taylor.morgan.${seed}@linkedin.com`;
  }

  const res = await fetch("/api/v1/auth/social", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      provider,
      email,
      name,
      role: customRole || "participant",
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `OAuth sign in with ${provider} failed`);
  }

  const data = await res.json();
  const user: AuthUser = {
    user_id: data.user_id,
    email: data.email,
    name: data.name || name,
    role: data.role,
    avatar_url: data.avatar_url,
    token: data.token || data.access_token,
  };

  saveStoredUser(user);
  return user;
}

/**
 * Quick persona login — hits the REAL backend with the demo password.
 * Replaced the old approach of directly setting hardcoded session tokens.
 */
export async function quickPersonaLogin(
  personaKey: "admin" | "organizer" | "judge_a" | "judge_b" | "participant"
): Promise<AuthUser> {
  const p = TEST_PERSONAS[personaKey];
  if (!p) throw new Error("Unknown persona");

  // Always hit the real auth endpoint — backend verifies bcrypt password
  return loginWithCredentials(p.email, p.password);
}

// ─── Session verification ─────────────────────────────────────────────────────

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/v1/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user: AuthUser = {
      user_id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar_url: data.avatar_url,
      token: data.token,
    };
    saveStoredUser(user);
    return user;
  } catch {
    return getStoredUser();
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore network error during logout
  }
  clearSessionCookie();
  if (typeof window !== "undefined") {
    localStorage.removeItem("dogfood_user");
    window.dispatchEvent(new CustomEvent("dogfood_auth_change", { detail: null }));
  }
}
