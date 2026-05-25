// Shared static data for ActProve.

export const EU_EEA_COUNTRIES: { code: string; name: string }[] = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
];

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "E-commerce",
  "Professional Services",
  "Manufacturing",
  "Education",
  "Other",
] as const;

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "200+"] as const;

/** EU AI Act key enforcement dates (spec §23.1). */
export const EU_AI_ACT_DEADLINES = [
  {
    date: "2026-08-02",
    title: "EU AI Act — Full Enforcement",
    what: "High-risk AI system obligations & Article 50 transparency",
    status: "urgent" as const,
  },
  {
    date: "2026-12-02",
    title: "AI-Generated Content Labeling",
    what: "Synthetic media labeling requirements",
    status: "upcoming" as const,
  },
  {
    date: "2027-08-02",
    title: "EU AI Act — Annex I Systems",
    what: "AI embedded in regulated products (medical, automotive)",
    status: "future" as const,
  },
  {
    date: "2027-08-01",
    title: "DORA Full Enforcement",
    what: "Financial sector digital resilience",
    status: "future" as const,
  },
  {
    date: "2027-12-01",
    title: "CRA — Cyber Resilience Act",
    what: "Products with digital elements",
    status: "future" as const,
  },
];

/** The headline deadline used for countdowns across the app. */
export const PRIMARY_DEADLINE = new Date("2026-08-02T00:00:00Z");

export function daysUntil(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const ms = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export type PlanId = "starter" | "growth" | "team";

export const PLANS: {
  id: PlanId;
  name: string;
  price: number;
  systemLimit: number | null;
  seats: number | null;
  storageGb: number;
  features: string[];
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: 99,
    systemLimit: 10,
    seats: 3,
    storageGb: 1,
    features: [
      "Up to 10 AI systems",
      "Inventory & risk classification",
      "2 document templates",
      "Email alerts",
      "3 team seats",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 249,
    systemLimit: 30,
    seats: 10,
    storageGb: 10,
    features: [
      "Up to 30 AI systems",
      "Full document generator",
      "Trust Page & compliance badge",
      "CSV export",
      "10 team seats",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: 499,
    systemLimit: null,
    seats: null,
    storageGb: 50,
    features: [
      "Unlimited AI systems",
      "Multi-user roles",
      "Evidence vault",
      "Questionnaire auto-fill",
      "API access",
      "Unlimited seats",
    ],
  },
];

export const TRIAL_DAYS = 14;

export const DATA_TYPES = [
  { value: "personal", label: "Personal data (names, emails, IDs)" },
  { value: "biometric", label: "Biometric data (facial recognition, fingerprints)" },
  { value: "health", label: "Health / medical data" },
  { value: "financial", label: "Financial data" },
  { value: "behavioral", label: "Behavioral / usage data" },
  { value: "location", label: "Location data" },
  { value: "none", label: "No personal data" },
] as const;

export const AI_CATEGORIES = [
  { value: "crm", label: "CRM / Sales" },
  { value: "chatbot", label: "Chatbot / Support" },
  { value: "hr", label: "HR / Recruitment" },
  { value: "analytics", label: "Analytics / Data" },
  { value: "content", label: "Content / Marketing" },
  { value: "code", label: "Code / Development" },
  { value: "other", label: "Other" },
] as const;
