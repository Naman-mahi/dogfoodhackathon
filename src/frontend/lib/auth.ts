"use client";

export interface AuthUser {
  user_id: string;
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
  role: "organizer" | "judge" | "participant";
  session: string;
  description: string;
  badge: string;
}> = {
  organizer: {
    name: "DOGFOOD Admin",
    email: "organizer@dogfood.dev",
    password: "Password123!",
    role: "organizer",
    session: "org_7f2a",
    description: "Manage events, rubric weights, inspect judge progress, export CSV",
    badge: "Organizer",
  },
  judge_a: {
    name: "Tomas Varga (Judge A)",
    email: "tomas.varga@example.org",
    password: "Password123!",
    role: "judge",
    session: "jdg_a_91bc",
    description: "Evaluate track submissions blindly with isolated rubrics",
    badge: "Judge A",
  },
  judge_b: {
    name: "Wei Lindqvist (Judge B)",
    email: "wei.lindqvist@example.org",
    password: "Password123!",
    role: "judge",
    session: "jdg_b_44de",
    description: "Evaluate peer submissions blindly without cross-judge visibility",
    badge: "Judge B",
  },
  participant: {
    name: "Ada Lovelace",
    email: "ada@example.org",
    password: "Password123!",
    role: "participant",
    session: "prt_2e88",
    description: "Manage team projects, edit details, track likes & submission status",
    badge: "Participant",
  },
};

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
  localStorage.setItem("dogfood_user", JSON.stringify(user));
  if (user.token) {
    setSessionCookie(user.token);
  }
}

export function updateStoredUser(updates: Partial<AuthUser>) {
  if (typeof window === "undefined") return;
  const current = getStoredUser();
  if (current) {
    const updated = { ...current, ...updates };
    localStorage.setItem("dogfood_user", JSON.stringify(updated));
  }
}

export async function loginWithCredentials(email: string, password?: string, role?: string): Promise<AuthUser> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Authentication failed");
  }

  const data = await res.json();
  const user: AuthUser = {
    user_id: data.user_id,
    email: data.email,
    name: data.name || email.split("@")[0].toUpperCase(),
    role: data.role,
    avatar_url: data.avatar_url,
    token: data.token,
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
    token: data.token,
  };

  saveStoredUser(user);
  return user;
}

export async function socialLogin(provider: "google" | "github" | "linkedin", customRole?: string): Promise<AuthUser> {
  // Generate realistic mock identity for the provider
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
    token: data.token,
  };

  saveStoredUser(user);
  return user;
}

export async function quickPersonaLogin(personaKey: "organizer" | "judge_a" | "judge_b" | "participant"): Promise<AuthUser> {
  const p = TEST_PERSONAS[personaKey];
  if (!p) throw new Error("Unknown persona");

  setSessionCookie(p.session);
  const user: AuthUser = {
    user_id: personaKey === "organizer" ? "org_01" : personaKey === "judge_a" ? "jdg_01" : personaKey === "judge_b" ? "jdg_02" : "prt_01",
    email: p.email,
    name: p.name,
    role: p.role,
    avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${p.email}`,
    token: p.session,
  };
  saveStoredUser(user);
  return user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/v1/auth/me");
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
    await fetch("/api/v1/auth/logout", { method: "POST" });
  } catch {
    // Ignore network error during logout
  }
  clearSessionCookie();
  if (typeof window !== "undefined") {
    localStorage.removeItem("dogfood_user");
  }
}
