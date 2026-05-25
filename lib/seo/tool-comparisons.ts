export interface ToolComparison {
  slug: string;
  competitor: string;
  title: string;
  intro: string;
  rows: { feature: string; actprove: string; them: string }[];
}

/** Competitor / "alternative" SEO pages (spec §6.4.1). */
export const TOOL_COMPARISONS: ToolComparison[] = [
  {
    slug: "onetrust-alternative",
    competitor: "OneTrust",
    title: "ActProve vs OneTrust — an SMB-friendly alternative",
    intro:
      "OneTrust is a powerful enterprise GRC suite, but it's priced and scoped for large organisations. ActProve is purpose-built for SMBs that need EU AI Act compliance fast.",
    rows: [
      { feature: "Price", actprove: "$99–$499/mo", them: "$20K–$50K+/yr, sales-led" },
      { feature: "Setup time", actprove: "Under 2 hours, self-serve", them: "Weeks–months, implementation" },
      { feature: "Focus", actprove: "EU AI Act-first, SMB UX", them: "Broad GRC, AI as a module" },
      { feature: "Trust Page", actprove: "Built-in, public", them: "Add-on" },
      { feature: "AI risk classification", actprove: "Automatic + AI-assisted", them: "Questionnaire-driven" },
    ],
  },
  {
    slug: "vanta-alternative-eu-ai-act",
    competitor: "Vanta",
    title: "ActProve vs Vanta for EU AI Act",
    intro:
      "Vanta is excellent for SOC 2 and ISO 27001 automation. For EU AI Act specifically, ActProve goes deeper — risk classification, transparency notices and a living register built around the regulation.",
    rows: [
      { feature: "EU AI Act depth", actprove: "Primary product", them: "Emerging coverage" },
      { feature: "AI inventory + classification", actprove: "Core feature", them: "Limited" },
      { feature: "Transparency notices & docs", actprove: "Generated for you", them: "Not focused" },
      { feature: "Multi-regulation", actprove: "EU AI Act, ISO 42001, NIS2, DORA", them: "SOC 2, ISO 27001-first" },
    ],
  },
  {
    slug: "free-eu-ai-act-tools",
    competitor: "free questionnaires",
    title: "ActProve vs free EU AI Act checkers",
    intro:
      "Free tools give you a one-time questionnaire and a static result. ActProve is a living compliance system that stays current and produces audit-ready evidence.",
    rows: [
      { feature: "Ongoing value", actprove: "Living register, monitoring", them: "One-time result" },
      { feature: "Documents", actprove: "Generated & versioned", them: "None" },
      { feature: "Trust Page & evidence", actprove: "Yes", them: "No" },
      { feature: "Regulation updates", actprove: "Personalised alerts", them: "No" },
    ],
  },
];

export function getToolComparison(slug: string) {
  return TOOL_COMPARISONS.find((c) => c.slug === slug);
}
