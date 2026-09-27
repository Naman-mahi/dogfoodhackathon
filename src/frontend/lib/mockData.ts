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
  prize: string;
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
  name?: string; // Event model compatibility
  tagline: string;
  status: "live" | "upcoming" | "completed";
  format: "online" | "in-person" | "hybrid";
  category: "ai" | "web3" | "devtools" | "opensource" | "climate";
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
  submissions_close?: string; // Event model compatibility
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

  // External Links & Ecosystem
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
  track: string;
  trackLabel: string;
  team: string;
  repoUrl: string;
  demoUrl?: string;
  submittedAt: string;
  problem: string;
  solution: string;
  technologies: string[];
  hackathonId: string;
  hackathonSlug: string;
  likesCount: number;
  featured?: boolean;
}

export const HACKATHONS_DATA: Hackathon[] = [
  {
    id: "sample-hack-2026",
    slug: "sample-hack-2026",
    title: "Sample Hack 2026 (DOGFOOD)",
    name: "Sample Hack 2026",
    submissions_close: "2026-03-01T18:00:00Z",
    tagline: "Official distributed hackathon platform challenge. Test score calibration, peer isolation, and offline appliance resilience.",
    judges: [
      { id: "jdg_01", name: "Tomas Varga", email: "tomas.varga@example.org", role: "Principal Systems Engineer", tracks: ["devtools-infra"] },
      { id: "jdg_02", name: "Wei Lindqvist", email: "wei.lindqvist@example.org", role: "Distributed Systems Researcher", tracks: ["calibration-stats"] },
      { id: "jdg_03", name: "Elena Rostova", email: "elena.rostova@example.org", role: "Cryptography Engineer", tracks: ["zero-trust-privacy"] },
    ],
    status: "live",
    format: "online",
    category: "devtools",
    categoryLabel: "DevTools & Infra",
    location: "Global · Online",
    prizeAmount: 25000,
    prizeDisplay: "$25,000 USD",
    participantCount: 1420,
    submissionCount: 42,
    deadlineDisplay: "Closing in 2 days",
    gradient: "from-blue-600 via-indigo-600 to-sky-500",

    startDate: "2026-02-15T09:00:00Z",
    endDate: "2026-03-01T18:00:00Z",
    timezone: "UTC",
    isFree: true,
    entryFeeDisplay: "Free Entry",
    host: "DOGFOOD Foundation",
    level: "All Skill Levels",
    teamSizeLimit: "1 - 4 Members",
    eligibilitySummary: "Open to individual developers and teams of up to 4 worldwide. All submitted code must be created during the event.",

    communityLinks: {
      website: "https://dogfood.dev",
      discord: "https://discord.gg/dogfood-hackathon",
      github: "https://github.com/dogfood-hackathon",
      twitter: "https://x.com/dogfood_hack",
    },

    tracks: [
      {
        id: "devtools-infra",
        name: "DevTools & Systems Infrastructure",
        prize: "$12,000",
        description: "Build developer productivity tools, local test harnesses, and offline sync utilities.",
      },
      {
        id: "calibration-stats",
        name: "Empirical Bayes & Fair Judging",
        prize: "$8,000",
        description: "Develop algorithms and visualizations to calibrate reviewer severity and eliminate herd bias.",
      },
      {
        id: "zero-trust-privacy",
        name: "Zero-Trust Reviewer Privacy",
        prize: "$5,000",
        description: "Design cryptographic blind evaluation pipelines and peer-isolated judging architectures.",
      },
    ],

    judgingCriteria: [
      {
        title: "Technical Rigor & Code Quality",
        weight: "30%",
        description: "Architectural robustness, thorough automated test coverage, and clear running instructions.",
      },
      {
        title: "Empirical Calibration Accuracy",
        weight: "25%",
        description: "Statistical accuracy in removing leniency and severity outliers from peer review sets.",
      },
      {
        title: "UI / UX Design & Accessibility",
        weight: "25%",
        description: "Modern, responsive, intuitive developer interface with high visual polish.",
      },
      {
        title: "Offline & Edge Resilience",
        weight: "20%",
        description: "System behavior during disconnected operation and graceful multi-peer state reconciliation.",
      },
    ],

    sponsors: [
      { name: "Google DeepMind", tier: "Title Sponsor" },
      { name: "Cloud Native Computing Foundation", tier: "Platinum" },
      { name: "Mozilla Open Source Support", tier: "Gold" },
      { name: "Supabase", tier: "Ecosystem Partner" },
    ],

    overview: {
      description: "Sample Hack 2026 brings together builders, systems programmers, and UI designers to engineer resilient developer tools, distributed applications, and intelligent agent workflows. Every project is evaluated with mathematical rigor: peer-blind judging ensures no reviewer can inspect peer scores, while Empirical Bayes normalization guarantees fair rank convergence.",
      highlights: [
        {
          title: "Rapid Sprint",
          description: "Fast-paced 48-hour development sprints from team formation to live demonstration.",
        },
        {
          title: "Zero-Trust Judging",
          description: "Double-blind evaluations prevent score leaks, herd behavior, and reviewer collusion.",
        },
        {
          title: "Empirical Bayes Calibration",
          description: "Severity bias and leniency are mathematically eliminated with shrinkage normalization (k=2.0).",
        },
      ],
    },
    rules: [
      {
        title: "1. Team Composition",
        description: "Teams may consist of 1 to 4 participants. Cross-disciplinary teams (mixing engineering, design, and product) are encouraged. Solo builders are fully eligible.",
      },
      {
        title: "2. Code Originality",
        description: "All submitted projects must be developed during the official sprint period. Open-source libraries and frameworks are permitted, but core logic must be created during the event.",
      },
      {
        title: "3. Public Repository Requirement",
        description: "Submissions must include a valid public repository URL (e.g. GitHub or GitLab) with a descriptive README, architecture overview, and running instructions.",
      },
      {
        title: "4. Intellectual Property Rights",
        description: "Participants retain 100% intellectual property ownership of their source code, designs, and intellectual assets.",
      },
    ],
    timeline: [
      {
        id: "sh-1",
        phase: "Phase 1",
        timestamp: "Feb 15, 2026 · 09:00 UTC",
        title: "Registration & Team Formation",
        description: "Participants register accounts, select tracks, form multi-disciplinary squads, and submit problem briefs.",
        status: "completed",
        statusLabel: "Completed",
      },
      {
        id: "sh-2",
        phase: "Phase 2",
        timestamp: "Feb 25, 2026 · 12:00 UTC",
        title: "Hackathon Sprint Commences",
        description: "Official repository submissions open. Teams push code, deploy prototypes, and prepare demonstration assets.",
        status: "completed",
        statusLabel: "Completed",
      },
      {
        id: "sh-3",
        phase: "Phase 3",
        timestamp: "March 1, 2026 · 18:00 UTC",
        title: "Submissions Locked & Blind Review Begins",
        description: "Repositories freeze and commit hashes are verified. Assigned judges begin isolated double-blind evaluations without peer score visibility.",
        status: "active",
        statusLabel: "Active Stage · In Progress",
      },
      {
        id: "sh-4",
        phase: "Phase 4",
        timestamp: "March 7, 2026 · 12:00 UTC",
        title: "Empirical Bayes Score Calibration",
        description: "The automated engine runs shrinkage algorithms across all reviewer score matrices to normalize judge severity curves.",
        status: "upcoming",
        statusLabel: "Upcoming",
      },
      {
        id: "sh-5",
        phase: "Phase 5",
        timestamp: "March 10, 2026 · 18:00 UTC",
        title: "Calibrated Results & Winner Accolades",
        description: "Final podium rankings revealed publicly. Prize disbursal and HMAC-SHA256 participation certificates generated.",
        status: "upcoming",
        statusLabel: "Final Stage",
      },
    ],
    prizes: [
      {
        place: "1st Place",
        amount: "$12,000",
        title: "Grand Champion",
        description: "Highest calibrated score across all competition tracks.",
      },
      {
        place: "2nd Place",
        amount: "$8,000",
        title: "1st Runner Up",
        description: "Second highest calibrated score overall.",
      },
      {
        place: "3rd Place",
        amount: "$5,000",
        title: "2nd Runner Up",
        description: "Third highest calibrated score overall.",
      },
    ],
    faqs: [
      {
        id: "sh-faq-1",
        question: "Can I participate alone?",
        answer: "Yes, solo builders are welcome, or you can form teams of up to 4 participants.",
      },
      {
        id: "sh-faq-2",
        question: "How does score normalization work?",
        answer: "We use Empirical Bayes normalization to shrink raw judge ratings toward global distribution parameters, eliminating harsh and lenient scoring bias.",
      },
      {
        id: "sh-faq-3",
        question: "Can I update my repository after the deadline?",
        answer: "The system records commit hashes at the submission deadline. Subsequent commits made after the deadline will not be evaluated.",
      },
      {
        id: "sh-faq-4",
        question: "Who retains the intellectual property rights?",
        answer: "Participants retain 100% intellectual property ownership of all source code, architecture, and assets created during the hackathon.",
      },
    ],
  },
  {
    id: "ai-catalyst-sprint",
    slug: "ai-catalyst-sprint",
    title: "AI Catalyst National Sprint 2026",
    tagline: "Build next-generation multi-agent systems, offline LLMOps pipelines, and edge-native neural models.",
    status: "live",
    format: "online",
    category: "ai",
    categoryLabel: "Artificial Intelligence & ML",
    location: "Global · Online",
    prizeAmount: 50000,
    prizeDisplay: "$50,000 USD",
    participantCount: 2850,
    submissionCount: 88,
    deadlineDisplay: "Closing in 5 days",
    gradient: "from-purple-700 via-indigo-800 to-slate-900",

    startDate: "2026-10-01T00:00:00Z",
    endDate: "2026-11-25T23:59:00Z",
    submissions_close: "2026-11-20T23:59:59Z",
    timezone: "PST",
    isFree: true,
    entryFeeDisplay: "Free Entry",
    host: "DeepMind & AI Research Alliance",
    level: "Intermediate to Advanced",
    teamSizeLimit: "1 - 5 Members",
    eligibilitySummary: "Open to international researchers and software engineers. Projects must feature open-weights models.",

    communityLinks: {
      website: "https://aicatalyst2026.org",
      discord: "https://discord.gg/ai-catalyst",
      github: "https://github.com/ai-catalyst-sprint",
      twitter: "https://x.com/ai_catalyst",
    },

    tracks: [
      {
        id: "autonomous-agents",
        name: "Autonomous Multi-Agent Swarms",
        prize: "$25,000",
        description: "Orchestrate multi-step task planning, self-reflection, and robust tool use under rate limits.",
      },
      {
        id: "edge-inference",
        name: "Edge & Offline Neural Inference",
        prize: "$15,000",
        description: "Deploy 1-bit to 4-bit quantized open-weights models completely offline on laptops and mobile devices.",
      },
      {
        id: "ai-safety-benchmarks",
        name: "Deterministic AI Safety & Alignment",
        prize: "$10,000",
        description: "Build automated test suites for prompt injections, hallucination mitigation, and output guards.",
      },
    ],

    judgingCriteria: [
      {
        title: "Model Efficiency & Latency",
        weight: "35%",
        description: "Execution time per token, memory overhead, and resource efficiency on target hardware.",
      },
      {
        title: "Autonomous Agent Capability",
        weight: "35%",
        description: "Success rate across complex multi-step reasoning benchmarks and external tool invocation.",
      },
      {
        title: "Code Cleanliness & Reproducibility",
        weight: "30%",
        description: "Dockerized setup instructions and automated evaluation scripts with deterministic seeds.",
      },
    ],

    sponsors: [
      { name: "Google Cloud", tier: "Title Sponsor" },
      { name: "NVIDIA Inception", tier: "Platinum" },
      { name: "Hugging Face", tier: "Gold" },
      { name: "Ollama", tier: "Ecosystem Partner" },
    ],

    overview: {
      description: "AI Catalyst National Sprint challenges engineering teams to deploy autonomous multi-agent environments, edge-optimized quantizations, and local inference tooling. Focus areas include real-time reasoning, tool use, and offline neural execution.",
      highlights: [
        {
          title: "Multi-Agent Systems",
          description: "Design coordinating autonomous agent swarms with deterministic failure recovery.",
        },
        {
          title: "Edge Model Deployment",
          description: "Run compact 1-bit to 4-bit quantized models completely locally on consumer hardware.",
        },
        {
          title: "Real-World Benchmark Datasets",
          description: "Evaluate pipelines against standard agentic benchmarks for accuracy and latency.",
        },
      ],
    },
    rules: [
      {
        title: "1. Open Source Weights & Tooling",
        description: "Projects must utilize openly available model weights (e.g. Gemma, Llama, Mistral) and open toolchain dependencies.",
      },
      {
        title: "2. Reproducible Benchmarking",
        description: "Submissions must include automated reproduction scripts and memory/latency profiling logs.",
      },
      {
        title: "3. Responsible AI & Safety",
        description: "All builds must respect safety guidelines and incorporate prompt-injection mitigations.",
      },
    ],
    timeline: [
      {
        id: "ai-1",
        phase: "Phase 1",
        timestamp: "March 1, 2026 · 00:00 PST",
        title: "Problem Statements Released & Registration",
        description: "Tracks open for agent architecture and edge ML submissions.",
        status: "completed",
        statusLabel: "Completed",
      },
      {
        id: "ai-2",
        phase: "Phase 2",
        timestamp: "March 8, 2026 · 12:00 PST",
        title: "Mid-Sprint Checkpoint & Mentor Reviews",
        description: "Architecture reviews and feedback from senior research engineers.",
        status: "active",
        statusLabel: "Active Stage · In Progress",
      },
      {
        id: "ai-3",
        phase: "Phase 3",
        timestamp: "March 15, 2026 · 23:59 PST",
        title: "Code Freeze & Automated Latency Benchmarking",
        description: "Model weights and Docker containers frozen for automated evaluation.",
        status: "upcoming",
        statusLabel: "Upcoming",
      },
      {
        id: "ai-4",
        phase: "Phase 4",
        timestamp: "March 20, 2026 · 18:00 PST",
        title: "Winners & Research Grants Announced",
        description: "$50,000 prize distribution and compute credit allocations.",
        status: "upcoming",
        statusLabel: "Upcoming",
      },
    ],
    prizes: [
      {
        place: "1st Place",
        amount: "$25,000",
        title: "Best Multi-Agent System",
        description: "Highest performance in multi-agent coordination and task completion.",
      },
      {
        place: "2nd Place",
        amount: "$15,000",
        title: "Best Edge Optimization",
        description: "Lowest latency and memory footprint on resource-constrained devices.",
      },
      {
        place: "3rd Place",
        amount: "$10,000",
        title: "Most Novel Tool Architecture",
        description: "Most innovative integration of external APIs and local tool callers.",
      },
    ],
    faqs: [
      {
        id: "ai-faq-1",
        question: "Can we use proprietary commercial APIs?",
        answer: "Projects must demonstrate capability with open-weights models; commercial APIs can be used only as optional fallback comparisons.",
      },
      {
        id: "ai-faq-2",
        question: "Is compute provided?",
        answer: "Eligible registered teams receive cloud compute credits upon submitting an approved project proposal.",
      },
    ],
  },
  {
    id: "open-source-build-india",
    slug: "open-source-build-india",
    title: "Open Source Kernel & Systems 2026",
    tagline: "Contribute to global developer tools, lightweight databases, container runtimes, and compiler tooling.",
    status: "upcoming",
    format: "hybrid",
    category: "opensource",
    categoryLabel: "Open Source",
    location: "Bengaluru + Remote",
    prizeAmount: 15000,
    prizeDisplay: "$15,000 USD",
    participantCount: 890,
    submissionCount: 0,
    deadlineDisplay: "Starts April 12",
    gradient: "from-emerald-600 via-teal-700 to-cyan-800",

    startDate: "2026-04-12T10:00:00Z",
    endDate: "2026-04-26T18:00:00Z",
    timezone: "IST",
    isFree: true,
    entryFeeDisplay: "Free Entry",
    host: "Open Source India Initiative",
    level: "All Skill Levels",
    teamSizeLimit: "1 - 3 Members",
    eligibilitySummary: "Open to developers of all backgrounds worldwide. Hybrid participation available with in-person mentoring hubs in Bengaluru.",

    communityLinks: {
      website: "https://opensourceindia.tech",
      discord: "https://discord.gg/os-india",
      github: "https://github.com/open-source-india",
      twitter: "https://x.com/opensource_in",
    },

    tracks: [
      {
        id: "systems-tooling",
        name: "Kernel & Systems Tooling",
        prize: "$8,000",
        description: "Low-level allocators, container runtimes, eBPF probes, and compiler backends in Rust, C, and Zig.",
      },
      {
        id: "developer-dx",
        name: "Developer Ergonomics & CLI",
        prize: "$4,500",
        description: "Fast terminal utilities, language servers, and interactive debugging extensions.",
      },
      {
        id: "docs-community",
        name: "Community & Accessibility Award",
        prize: "$2,500",
        description: "Comprehensive multilingual documentation, interactive tutorials, and automated onboarding scripts.",
      },
    ],

    judgingCriteria: [
      {
        title: "Maintainer Code Standards",
        weight: "40%",
        description: "Code style alignment with upstream project guidelines and thorough unit tests.",
      },
      {
        title: "Performance & Resource Use",
        weight: "35%",
        description: "Microbenchmark speedup and zero memory leaks verified by Valgrind / AddressSanitizer.",
      },
      {
        title: "Documentation & DX",
        weight: "25%",
        description: "Clear explanations, step-by-step reproduction instructions, and beginner-friendly guidelines.",
      },
    ],

    sponsors: [
      { name: "Linux Foundation", tier: "Title Sponsor" },
      { name: "Red Hat Developer", tier: "Platinum" },
      { name: "GitHub Education", tier: "Gold" },
      { name: "Hasura", tier: "Ecosystem Partner" },
    ],

    overview: {
      description: "Open Source Kernel & Systems 2026 focuses on core infrastructure tooling: memory allocators, fast key-value engines, rootless container sandboxes, and language compiler frontends.",
      highlights: [
        {
          title: "Core Infrastructure",
          description: "Build robust low-level components in Rust, C, Go, and Zig.",
        },
        {
          title: "Maintainer Mentorship",
          description: "Direct mentorship from maintainers of prominent Apache and Linux Foundation projects.",
        },
      ],
    },
    rules: [
      {
        title: "1. OSI-Approved License",
        description: "All codebase submissions must adopt an OSI-approved open source license (MIT, Apache-2.0, or BSD).",
      },
      {
        title: "2. Unit & Integration Test Coverage",
        description: "Every submission must contain comprehensive test coverage and CI workflow definitions.",
      },
    ],
    timeline: [
      {
        id: "os-1",
        phase: "Phase 1",
        timestamp: "April 12, 2026 · 10:00 IST",
        title: "Opening Keynote & Track Reveal",
        description: "Live launch event in Bengaluru and virtual stream.",
        status: "upcoming",
        statusLabel: "Upcoming",
      },
      {
        id: "os-2",
        phase: "Phase 2",
        timestamp: "April 26, 2026 · 18:00 IST",
        title: "Final Pull Request Submissions",
        description: "Code freeze and review by open-source project maintainers.",
        status: "upcoming",
        statusLabel: "Upcoming",
      },
    ],
    prizes: [
      {
        place: "1st Place",
        amount: "$8,000",
        title: "Infrastructure Champion",
        description: "Highest rated kernel/systems contribution.",
      },
      {
        place: "2nd Place",
        amount: "$4,500",
        title: "Best Developer Tooling",
        description: "Most ergonomic and impactful developer productivity tool.",
      },
      {
        place: "3rd Place",
        amount: "$2,500",
        title: "Community Contributor Award",
        description: "Excellence in documentation, accessibility, and community engagement.",
      },
    ],
    faqs: [
      {
        id: "os-faq-1",
        question: "Can beginners participate?",
        answer: "Yes, dedicated beginner-friendly tracks and mentors are available for first-time systems contributors.",
      },
    ],
  },
  {
    id: "zero-knowledge-summit-hack",
    slug: "zero-knowledge-summit-hack",
    title: "Zero-Knowledge & Privacy Sprint",
    tagline: "Construct privacy-preserving protocols, succinct proofs, and identity verification modules.",
    status: "upcoming",
    format: "online",
    category: "web3",
    categoryLabel: "Web3 & Blockchain",
    location: "Global · Online",
    prizeAmount: 35000,
    prizeDisplay: "$35,000 USD",
    participantCount: 1120,
    submissionCount: 0,
    deadlineDisplay: "Starts May 1",
    gradient: "from-amber-600 via-orange-600 to-yellow-500",

    startDate: "2026-05-01T00:00:00Z",
    endDate: "2026-05-15T23:59:00Z",
    timezone: "UTC",
    isFree: true,
    entryFeeDisplay: "Free Entry",
    host: "Privacy Research Collective",
    level: "Advanced",
    teamSizeLimit: "1 - 4 Members",
    eligibilitySummary: "Open to cryptographers, smart contract developers, and ZK researchers worldwide.",

    communityLinks: {
      website: "https://zksummit2026.org",
      discord: "https://discord.gg/zk-hack",
      github: "https://github.com/zk-summit-hack",
      twitter: "https://x.com/zk_summit",
    },

    tracks: [
      {
        id: "snark-circuits",
        name: "Succinct Proof Circuits",
        prize: "$20,000",
        description: "Optimized Circom, Halo2, and Noir circuits for zero-knowledge state transitions.",
      },
      {
        id: "client-prover",
        name: "Browser & Mobile Provers",
        prize: "$10,000",
        description: "WebAssembly and WebGPU hardware-accelerated proving engines running client-side.",
      },
      {
        id: "private-identity",
        name: "Anonymous Attestations",
        prize: "$5,000",
        description: "Selective disclosure identity credentials adhering to W3C verifiable credentials.",
      },
    ],

    judgingCriteria: [
      {
        title: "Cryptographic Soundness",
        weight: "45%",
        description: "Absence of constraint under-specification and zero mathematical soundness flaws.",
      },
      {
        title: "Prover & Verifier Benchmark",
        weight: "35%",
        description: "Constraint count optimization and client-side proof generation speed in seconds.",
      },
      {
        title: "Documentation & Usability",
        weight: "20%",
        description: "Integration ease for third-party web apps and clear circuit verification guidelines.",
      },
    ],

    sponsors: [
      { name: "Ethereum Foundation", tier: "Title Sponsor" },
      { name: "Aztec Network", tier: "Platinum" },
      { name: "StarkWare", tier: "Gold" },
      { name: "Scroll", tier: "Ecosystem Partner" },
    ],

    overview: {
      description: "Build cutting-edge zero-knowledge proof circuits, client-side proving engines, and anonymous credential issuers.",
      highlights: [
        {
          title: "Succinct Proof Circuits",
          description: "Write optimized circuits in Circom, Halo2, or Noir.",
        },
        {
          title: "Client-Side Verification",
          description: "Verify complex mathematical proofs directly inside web browsers.",
        },
      ],
    },
    rules: [
      {
        title: "1. Open Verification Keys",
        description: "All ceremony artifacts and verification keys must be openly verifiable.",
      },
    ],
    timeline: [
      {
        id: "zk-1",
        phase: "Phase 1",
        timestamp: "May 1, 2026 · 00:00 UTC",
        title: "Sprint Kickoff & Prover Setup",
        description: "Circuits released and challenge tracks begin.",
        status: "upcoming",
        statusLabel: "Upcoming",
      },
    ],
    prizes: [
      {
        place: "1st Place",
        amount: "$20,000",
        title: "ZK Innovation Grand Prize",
        description: "Best privacy-preserving system architecture.",
      },
    ],
    faqs: [
      {
        id: "zk-faq-1",
        question: "Which proving systems are supported?",
        answer: "Groth16, PLONK, Halo2, and STARK-based frameworks are all welcome.",
      },
    ],
  },
  {
    id: "climate-tech-hackathon",
    slug: "climate-tech-hackathon",
    title: "Planetary Climate Tech Sprint",
    tagline: "IoT sensor telemetry, carbon footprint forecasting, and distributed clean energy grid monitoring.",
    status: "completed",
    format: "in-person",
    category: "climate",
    categoryLabel: "Climate & Health",
    location: "San Francisco, CA",
    prizeAmount: 20000,
    prizeDisplay: "$20,000 USD",
    participantCount: 750,
    submissionCount: 31,
    deadlineDisplay: "Ended Feb 2026",
    gradient: "from-teal-800 via-cyan-900 to-slate-900",

    startDate: "2026-02-01T09:00:00Z",
    endDate: "2026-02-14T18:00:00Z",
    timezone: "PST",
    isFree: true,
    entryFeeDisplay: "Free Entry",
    host: "Global Climate Innovation Fund",
    level: "All Skill Levels",
    teamSizeLimit: "1 - 4 Members",
    eligibilitySummary: "In-person event held in San Francisco. Hardware and simulated IoT sensors were provided to participants.",

    communityLinks: {
      website: "https://climatehackathon.earth",
      github: "https://github.com/climate-tech-sprint",
      twitter: "https://x.com/climate_tech_sf",
    },

    tracks: [
      {
        id: "clean-grid",
        name: "Clean Grid Load Balancing",
        prize: "$12,000",
        description: "Forecasting renewable energy intermittency and routing data center workloads dynamically.",
      },
      {
        id: "emissions-telemetry",
        name: "Real-Time Cloud Emissions",
        prize: "$8,000",
        description: "Granular eBPF CPU Joules conversion to regional grid marginal emission metrics.",
      },
    ],

    judgingCriteria: [
      {
        title: "Measurement Accuracy",
        weight: "40%",
        description: "Validation against verified EPA station sensors and power analyzer instruments.",
      },
      {
        title: "Scalability & Practicality",
        weight: "35%",
        description: "Feasibility of immediate deployment in production data centers and micro-grids.",
      },
      {
        title: "Visualization & Transparency",
        weight: "25%",
        description: "Public dashboards explaining environmental savings clearly to stakeholders.",
      },
    ],

    sponsors: [
      { name: "Clean Energy Alliance", tier: "Title Sponsor" },
      { name: "Grafana Labs", tier: "Platinum" },
      { name: "Planet Labs", tier: "Gold" },
    ],

    overview: {
      description: "Engineers and environmental data scientists engineered real-time telemetry pipelines and clean grid load balancers.",
      highlights: [
        {
          title: "IoT Sensor Grids",
          description: "Real-time edge telemetry for carbon monitoring.",
        },
      ],
    },
    rules: [
      {
        title: "1. Verified Datasets",
        description: "Telemetry models were validated against real EPA climate station sensor logs.",
      },
    ],
    timeline: [
      {
        id: "cl-1",
        phase: "Phase 1",
        timestamp: "Feb 14, 2026 · 18:00 PST",
        title: "Hackathon Concluded & Winners Awarded",
        description: "All scores normalized and prizes distributed.",
        status: "completed",
        statusLabel: "Completed",
      },
    ],
    prizes: [
      {
        place: "1st Place",
        amount: "$12,000",
        title: "Clean Grid Champion",
        description: "Awarded to WarmTrail for marginal emissions forecasting.",
      },
    ],
    faqs: [
      {
        id: "cl-faq-1",
        question: "Can we access past projects?",
        answer: "Yes, all verified submissions are browseable in the public project gallery.",
      },
    ],
  },
  {
    id: "health-data-challenge",
    slug: "health-data-challenge",
    title: "Decentralized Health Analytics",
    tagline: "Confidential clinical data benchmarking, federated learning nodes, and patient privacy frameworks.",
    status: "completed",
    format: "hybrid",
    category: "climate",
    categoryLabel: "Climate & Health",
    location: "Berlin + Online",
    prizeAmount: 10000,
    prizeDisplay: "$10,000 USD",
    participantCount: 620,
    submissionCount: 24,
    deadlineDisplay: "Ended Jan 2026",
    gradient: "from-rose-600 via-pink-700 to-purple-800",

    startDate: "2026-01-10T09:00:00Z",
    endDate: "2026-01-24T18:00:00Z",
    timezone: "CET",
    isFree: true,
    entryFeeDisplay: "Free Entry",
    host: "Digital Health Research Hub",
    level: "All Skill Levels",
    teamSizeLimit: "1 - 4 Members",
    eligibilitySummary: "Open to biostatisticians, ML engineers, and healthcare practitioners. Synthetic anonymized clinical datasets only.",

    communityLinks: {
      website: "https://healthdata2026.eu",
      discord: "https://discord.gg/health-analytics",
      github: "https://github.com/health-data-challenge",
    },

    tracks: [
      {
        id: "federated-learning",
        name: "Federated Clinical Prediction",
        prize: "$6,000",
        description: "Decentralized hospital model training without moving raw electronic health records.",
      },
      {
        id: "differential-privacy",
        name: "Differential Privacy Guarantees",
        prize: "$4,000",
        description: "Epsilon-bounded privacy budgets for genomic dataset aggregation.",
      },
    ],

    judgingCriteria: [
      {
        title: "Privacy Budget Adherence",
        weight: "40%",
        description: "Strict differential privacy bounds with zero data leakage across model gradients.",
      },
      {
        title: "Clinical Metric Accuracy",
        weight: "40%",
        description: "Area under the ROC curve (AUROC) on holdout multi-institutional benchmark data.",
      },
      {
        title: "Auditability & Compliance",
        weight: "20%",
        description: "Traceable cryptographic audit logs complying with GDPR and HIPAA research standards.",
      },
    ],

    sponsors: [
      { name: "Charité Berlin Research", tier: "Title Sponsor" },
      { name: "European Health Data Space", tier: "Platinum" },
      { name: "OpenMined", tier: "Gold" },
    ],

    overview: {
      description: "Privacy-preserving clinical benchmarking using secure multi-party computation and differential privacy.",
      highlights: [
        {
          title: "Federated Learning",
          description: "Train medical prediction models across isolated hospital node clusters.",
        },
      ],
    },
    rules: [
      {
        title: "1. Zero Patient PII",
        description: "Synthetic medical data sets only; zero raw personal health information permitted.",
      },
    ],
    timeline: [
      {
        id: "hd-1",
        phase: "Phase 1",
        timestamp: "Jan 24, 2026 · 18:00 CET",
        title: "Evaluation Completed",
        description: "Double-blind review and certificate verification concluded.",
        status: "completed",
        statusLabel: "Completed",
      },
    ],
    prizes: [
      {
        place: "1st Place",
        amount: "$6,000",
        title: "Privacy Health Champion",
        description: "Awarded for differential privacy federated learning engine.",
      },
    ],
    faqs: [
      {
        id: "hd-faq-1",
        question: "Is clinical trial data synthetic?",
        answer: "Yes, fully anonymized and synthetic benchmarks were used exclusively.",
      },
    ],
  },
];

export const PROJECTS_DATA: Project[] = [
  {
    id: "prj_01",
    slug: "glass-signal",
    title: "Glass Signal",
    summary: "Distributed zero-trust event routing and verifiable telemetry appliance.",
    track: "devtools",
    trackLabel: "Developer Tools",
    team: "tm_01",
    repoUrl: "https://example.org/repo/01",
    demoUrl: "https://glass-signal.dogfood.dev",
    submittedAt: "2026-02-27T04:08:00Z",
    problem: "Peer evaluation in distributed events requires tamper-proof message routing across isolated evaluators.",
    solution: "A cryptographic event bus that routes blind evaluation payloads with HMAC authentication.",
    technologies: ["TypeScript", "Node.js", "PostgreSQL", "Docker"],
    hackathonId: "sample-hack-2026",
    hackathonSlug: "sample-hack-2026",
    likesCount: 154,
    featured: true,
  },
  {
    id: "prj_02",
    slug: "small-meadow",
    title: "Small Meadow",
    summary: "High-density statistical calibration pipeline for peer grading variance.",
    track: "devtools",
    trackLabel: "Data & Analytics",
    team: "tm_02",
    repoUrl: "https://example.org/repo/02",
    demoUrl: "https://small-meadow.dogfood.dev",
    submittedAt: "2026-02-27T20:06:00Z",
    problem: "Reviewer severity curves differ drastically without historical calibration data.",
    solution: "Empirical Bayes shrinkage calculation with global prior distribution normalization.",
    technologies: ["Python", "FastAPI", "SQLAlchemy", "NumPy"],
    hackathonId: "sample-hack-2026",
    hackathonSlug: "sample-hack-2026",
    likesCount: 132,
    featured: true,
  },
  {
    id: "prj_03",
    slug: "deep-compass",
    title: "Deep Compass",
    summary: "Air-gapped offline synchronization gateway for disconnected judging environments.",
    track: "devtools",
    trackLabel: "Systems & Infra",
    team: "tm_03",
    repoUrl: "https://example.org/repo/03",
    demoUrl: "https://deep-compass.dogfood.dev",
    submittedAt: "2026-02-28T16:58:00Z",
    problem: "Unreliable venue networks lead to lost review scores during live judging windows.",
    solution: "Local SQLite buffer that verifies signatures and performs conflict-free state reconciliation.",
    technologies: ["Go", "SQLite", "Protobuf", "Tailwind CSS"],
    hackathonId: "sample-hack-2026",
    hackathonSlug: "sample-hack-2026",
    likesCount: 118,
    featured: true,
  },
  {
    id: "bayesian-rank-calibrator",
    slug: "bayesian-rank-calibrator",
    title: "Bayesian Rank Calibrator",
    summary: "Automated Empirical Bayes shrinkage engine for zero-bias peer grading with reviewer severity calibration.",
    track: "devtools",
    trackLabel: "DevTools & Infra",
    team: "BayesNet Labs",
    repoUrl: "https://github.com/dogfood-hackathon/bayesian-rank-calibrator",
    demoUrl: "https://calibrator.dogfood.dev",
    submittedAt: "2026-02-28T14:30:00Z",
    problem: "Peer evaluation in large hackathons suffers from severe reviewer grading variance, leniency bias, and peer score leaks.",
    solution: "A mathematical pipeline implementing shrinkage estimation (k=2.0) that normalizes raw reviewer deviations against a global prior.",
    technologies: ["Python", "NumPy", "FastAPI", "React", "TypeScript", "Tailwind CSS"],
    hackathonId: "sample-hack-2026",
    hackathonSlug: "sample-hack-2026",
    likesCount: 142,
    featured: true,
  },
  {
    id: "zk-credential-vault",
    slug: "zk-credential-vault",
    title: "ZK Credential Vault",
    summary: "Zero-knowledge proof identity and attestation verification protocol for verifiable peer evaluations.",
    track: "web3",
    trackLabel: "Web3 & Cryptography",
    team: "ZKCipher Group",
    repoUrl: "https://github.com/dogfood-hackathon/zk-credential-vault",
    demoUrl: "https://zk-vault.dogfood.dev",
    submittedAt: "2026-02-27T19:15:00Z",
    problem: "Verifying participant qualifications without exposing personal identifying information (PII) or institutional affiliations.",
    solution: "Groth16 SNARK-based circuit proving participant eligibility and contribution integrity while keeping identities completely private.",
    technologies: ["Circom", "SnarkJS", "Solidity", "Next.js", "Ethers.js"],
    hackathonId: "sample-hack-2026",
    hackathonSlug: "sample-hack-2026",
    likesCount: 98,
    featured: true,
  },
  {
    id: "neural-diff-reviewer",
    slug: "neural-diff-reviewer",
    title: "Neural Diff Reviewer",
    summary: "Autonomous code review agent analyzing AST semantic context to catch race conditions and memory leaks.",
    track: "ai",
    trackLabel: "Artificial Intelligence",
    team: "SyntaxAI Engineering",
    repoUrl: "https://github.com/dogfood-hackathon/neural-diff-reviewer",
    demoUrl: "https://neural-diff.dogfood.dev",
    submittedAt: "2026-02-28T11:00:00Z",
    problem: "Traditional CI linting catches syntax errors but fails on complex concurrency bugs and distributed state synchronization flaws.",
    solution: "Tree-sitter AST parser integrated with local quantized LLM embeddings to detect semantic anti-patterns in git pull requests.",
    technologies: ["TypeScript", "Tree-sitter", "WebAssembly", "Ollama", "Rust"],
    hackathonId: "ai-catalyst-sprint",
    hackathonSlug: "ai-catalyst-sprint",
    likesCount: 175,
    featured: true,
  },
  {
    id: "edge-resilience-proxy",
    slug: "edge-resilience-proxy",
    title: "Edge Resilience Proxy",
    summary: "Air-gapped offline mesh network gateway allowing local judging and offline evaluation synchronization.",
    track: "devtools",
    trackLabel: "DevTools & Infra",
    team: "EdgeMesh Collective",
    repoUrl: "https://github.com/dogfood-hackathon/edge-resilience-proxy",
    demoUrl: "https://edge-proxy.dogfood.dev",
    submittedAt: "2026-02-26T16:45:00Z",
    problem: "Venues with intermittent or severed WAN connectivity block standard cloud judging systems, stalling live hackathon evaluations.",
    solution: "A lightweight SQLite-backed local appliance that buffers ratings cryptographically and performs dual-phase reconciliation on reconnect.",
    technologies: ["Go", "SQLite", "Docker", "mDNS", "Protobuf"],
    hackathonId: "sample-hack-2026",
    hackathonSlug: "sample-hack-2026",
    likesCount: 64,
  },
  {
    id: "carbon-footprint-trace",
    slug: "carbon-footprint-trace",
    title: "Carbon Footprint Trace",
    summary: "Real-time cloud workload energy and carbon emissions telemetry exporter for Kubernetes clusters.",
    track: "climate",
    trackLabel: "Climate & Energy",
    team: "GreenCloud Systems",
    repoUrl: "https://github.com/dogfood-hackathon/carbon-footprint-trace",
    demoUrl: "https://carbon-trace.dogfood.dev",
    submittedAt: "2026-02-25T13:20:00Z",
    problem: "Hackathon infrastructure and machine learning training jobs consume untracked power with no carbon footprint observability.",
    solution: "eBPF sensor reading hardware CPU energy telemetry and converting Joules to estimated regional gCO2eq in Prometheus dashboards.",
    technologies: ["Rust", "eBPF", "Prometheus", "Grafana", "Kubernetes"],
    hackathonId: "climate-tech-hackathon",
    hackathonSlug: "climate-tech-hackathon",
    likesCount: 112,
  },
  {
    id: "decentralized-git-sync",
    slug: "decentralized-git-sync",
    title: "Decentralized Git Sync",
    summary: "P2P cryptographic git bundle relay with peer-to-peer verifiable state synchronization over libp2p.",
    track: "opensource",
    trackLabel: "Open Source",
    team: "PeerSync Core",
    repoUrl: "https://github.com/dogfood-hackathon/decentralized-git-sync",
    demoUrl: "https://p2p-git.dogfood.dev",
    submittedAt: "2026-02-24T09:10:00Z",
    problem: "Centralized git forge outages during submission deadlines can prevent developers from meeting hard cut-offs.",
    solution: "Decentralized daemon streaming signed git packfiles across local network peers with cryptographic timestamp attestations.",
    technologies: ["Rust", "libp2p", "Git CLI", "RocksDB"],
    hackathonId: "open-source-build-india",
    hackathonSlug: "open-source-build-india",
    likesCount: 89,
  },
];

export const TIMELINE_DATA: TimelineMilestone[] = HACKATHONS_DATA[0].timeline;
export const FAQS_DATA: FaqItem[] = HACKATHONS_DATA[0].faqs;

// Data Model Bridge: Hackathon <-> Event
export type Event = Hackathon;
export const EVENTS_DATA: Event[] = HACKATHONS_DATA;

export function getHackathon(idOrSlug: string): Hackathon | undefined {
  return HACKATHONS_DATA.find((h) => h.slug === idOrSlug || h.id === idOrSlug);
}

export function getEvent(idOrSlug: string): Event | undefined {
  return getHackathon(idOrSlug);
}

export function getProjectsByHackathon(hackathonIdOrSlug: string): Project[] {
  return PROJECTS_DATA.filter(
    (p) =>
      p.hackathonId === hackathonIdOrSlug ||
      p.hackathonSlug === hackathonIdOrSlug
  );
}

export function getHackathonForProject(projectIdOrSlug: string): Hackathon | undefined {
  const project = PROJECTS_DATA.find(
    (p) => p.slug === projectIdOrSlug || p.id === projectIdOrSlug
  );
  if (!project) return undefined;
  return getHackathon(project.hackathonSlug || project.hackathonId);
}
