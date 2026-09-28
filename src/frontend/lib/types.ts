export interface TimelineMilestone {
  id: string;
  phase: string;
  timestamp: string;
  title: string;
  description: string;
  status: "completed" | "active" | "upcoming";
  statusLabel: string;
}

export interface PrizeTier {
  place: string;
  amount: string;
  title: string;
  description: string;
}

export interface RuleItem {
  title: string;
  description: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface OverviewHighlight {
  title: string;
  description: string;
}

export interface HackathonTrack {
  id: string;
  name: string;
  prize?: string;
  description: string;
}

export interface JudgingCriterion {
  title: string;
  weight: string;
  description: string;
}

export interface SponsorPartner {
  name: string;
  tier: "Title Sponsor" | "Platinum" | "Gold" | "Ecosystem Partner";
}

export interface CommunityLinks {
  website?: string;
  discord?: string;
  twitter?: string;
  github?: string;
}

export interface Judge {
  id: string;
  name: string;
  email: string;
  role?: string;
  tracks?: string[];
}

export interface Hackathon {
  id: string;
  slug: string;
  title: string;
  name?: string;
  tagline: string;
  status: "live" | "upcoming" | "completed";
  format: "online" | "in-person" | "hybrid";
  category: "ai" | "web3" | "devtools" | "opensource" | "climate" | string;
  categoryLabel: string;
  location: string;
  prizeAmount: number;
  prizeDisplay: string;
  participantCount: number;
  submissionCount: number;
  deadlineDisplay: string;
  gradient: string;

  // Schedule & Logistics
  startDate: string;
  endDate: string;
  submissions_close?: string;
  registration_deadline?: string;
  registrationDeadline?: string;
  is_registration_open?: boolean;
  isRegistrationOpen?: boolean;
  registration_closed_reason?: string;
  timezone: string;
  isFree: boolean;
  entryFeeDisplay: string;
  host: string;
  level: string;
  teamSizeLimit: string;
  eligibilitySummary: string;

  // Judges, Tracks & Ecosystem
  judges?: Judge[];
  communityLinks: CommunityLinks;
  tracks: HackathonTrack[];
  judgingCriteria: JudgingCriterion[];
  sponsors: SponsorPartner[];

  // Tab Content
  overview: {
    description: string;
    highlights: OverviewHighlight[];
  };
  rules: RuleItem[];
  timeline: TimelineMilestone[];
  prizes: PrizeTier[];
  faqs: FaqItem[];
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  track: string;
  trackLabel?: string;
  team: string;
  team_name?: string;
  teamName?: string;
  repoUrl: string;
  repo_url?: string;
  demoUrl?: string;
  demo_url?: string;
  submittedAt?: string;
  problem?: string;
  solution?: string;
  technologies: string[];
  hackathonId: string;
  hackathonSlug: string;
  likesCount?: number;
  featured?: boolean;
  status?: string;
}

