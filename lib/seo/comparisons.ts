export interface ComparisonRow {
  dimension: string;
  a: string;
  b: string;
}

export interface ComparisonPage {
  slug: string;
  title: string;
  aLabel: string;
  bLabel: string;
  intro: string;
  rows: ComparisonRow[];
  takeaway: string;
}

/** "EU AI Act vs X" SEO pages (spec §6.4.1). */
export const COMPARISON_PAGES: ComparisonPage[] = [
  {
    slug: "eu-ai-act-vs-gdpr",
    title: "EU AI Act vs GDPR",
    aLabel: "EU AI Act",
    bLabel: "GDPR",
    intro:
      "The EU AI Act and GDPR overlap but govern different things: the AI Act regulates AI systems by risk, GDPR regulates personal-data processing. Most SMBs need both.",
    rows: [
      { dimension: "Focus", a: "AI systems by risk tier", b: "Personal-data processing" },
      { dimension: "Trigger", a: "Providing/deploying AI in the EU", b: "Processing personal data of EU individuals" },
      { dimension: "Key duty", a: "Risk classification, transparency, oversight", b: "Lawful basis, data subject rights" },
      { dimension: "Max fines", a: "€35M or 7% turnover", b: "€20M or 4% turnover" },
      { dimension: "Overlap", a: "Art. 50 transparency, Annex III data governance", b: "Art. 22 automated decisions, DPIAs" },
    ],
    takeaway:
      "If your AI processes personal data, you must satisfy both. ActProve tracks AI Act obligations and flags GDPR intersections.",
  },
  {
    slug: "eu-ai-act-vs-iso-42001",
    title: "EU AI Act vs ISO 42001",
    aLabel: "EU AI Act",
    bLabel: "ISO/IEC 42001",
    intro:
      "The EU AI Act is binding law; ISO 42001 is a voluntary AI management-system standard. They share ~60% of documentation, so doing one accelerates the other.",
    rows: [
      { dimension: "Nature", a: "Mandatory regulation", b: "Voluntary certifiable standard" },
      { dimension: "Scope", a: "AI systems in the EU market", b: "Organisation-wide AI management system" },
      { dimension: "Proof", a: "Compliance evidence on demand", b: "Accredited certification (3-year cycle)" },
      { dimension: "Overlap", a: "Inventory, risk, roles, literacy", b: "Clauses 6.1.2, 5.3, 7.2, 8.4" },
    ],
    takeaway:
      "ActProve reuses your EU AI Act data to pre-fill ~60% of ISO 42001 — activate it in one click.",
  },
  {
    slug: "eu-ai-act-vs-nis2",
    title: "EU AI Act vs NIS2",
    aLabel: "EU AI Act",
    bLabel: "NIS2",
    intro:
      "The EU AI Act governs AI risk; NIS2 governs cybersecurity for critical sectors. Many tech and digital-service companies are in scope of both.",
    rows: [
      { dimension: "Focus", a: "AI system risk & transparency", b: "Cybersecurity risk management" },
      { dimension: "Who", a: "AI providers & deployers", b: "18 critical sectors" },
      { dimension: "Reporting", a: "Serious-incident reporting (high-risk)", b: "24h / 72h incident reporting" },
      { dimension: "Accountability", a: "Responsible person (Art. 4)", b: "Director personal liability" },
    ],
    takeaway:
      "ActProve's NIS2 module shares supplier and incident data with your AI Act register.",
  },
];

export function getComparisonPage(slug: string) {
  return COMPARISON_PAGES.find((c) => c.slug === slug);
}
