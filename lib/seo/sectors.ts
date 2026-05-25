export interface SectorPage {
  slug: string;
  name: string;
  headline: string;
  intro: string;
  commonHighRisk: string[];
  obligations: string[];
  crosswalk?: string;
}

/** Sector-specific EU AI Act guidance (spec §5, §6.4.1). */
export const SECTOR_PAGES: SectorPage[] = [
  {
    slug: "healthcare",
    name: "Healthcare",
    headline: "EU AI Act for Healthcare",
    intro:
      "Clinical AI is almost always high-risk under the EU AI Act. Healthcare providers face the strictest obligations and often a parallel Medical Device Regulation (MDR) check.",
    commonHighRisk: ["Diagnostic AI", "Treatment recommendation", "Patient triage", "Drug interaction checks"],
    obligations: [
      "Clinical validation evidence for diagnostic tools",
      "Patient disclosure / informed consent for AI assistance",
      "Documented human override by clinicians (Article 14)",
      "Fundamental Rights Impact Assessment (Article 27)",
      "Enhanced incident reporting for patient-safety events",
    ],
    crosswalk: "Most clinical AI also falls under the EU Medical Device Regulation (MDR) — double compliance applies.",
  },
  {
    slug: "fintech",
    name: "Finance & Fintech",
    headline: "EU AI Act for Finance & Fintech",
    intro:
      "Credit scoring and financial-decision AI is explicitly high-risk (Annex III). Financial entities also face DORA ICT-resilience requirements.",
    commonHighRisk: ["Credit scoring", "Fraud detection", "Trading algorithms", "KYC verification"],
    obligations: [
      "Explainability — document factors and provide explanations to rejected applicants",
      "Bias testing for discriminatory outcomes",
      "Documented human-review escalation for AI-rejected applications",
      "Map to EBA model-governance guidance",
    ],
    crosswalk: "Financial entities also face DORA — ActProve shows the overlap so you complete both at once.",
  },
  {
    slug: "hr-recruitment",
    name: "HR & Recruitment",
    headline: "EU AI Act for HR & Recruitment",
    intro:
      "AI used in hiring or worker management is high-risk (Annex III). CV screeners and interview analysis tools carry significant obligations.",
    commonHighRisk: ["CV / resume screening", "Interview analysis", "Performance monitoring", "Shift allocation"],
    obligations: [
      "Transparency to candidates about AI use",
      "Anti-discrimination / bias testing",
      "A documented human-review path for AI decisions",
      "GDPR Article 22 crosswalk for automated decisions",
    ],
    crosswalk: "Overlaps with GDPR Article 22 (automated individual decision-making).",
  },
  {
    slug: "ecommerce",
    name: "E-commerce & Retail",
    headline: "EU AI Act for E-commerce & Retail",
    intro:
      "Most retail AI (recommendations, pricing) is minimal or limited risk, but customer-facing AI triggers transparency obligations.",
    commonHighRisk: ["Dynamic pricing", "Recommendation engines", "Demand forecasting", "Fraud detection"],
    obligations: [
      "Transparency notices on customer-facing AI and chatbots (Article 50)",
      "Disclosure of personalisation and dynamic pricing where required",
      "Label AI-generated product content",
    ],
  },
  {
    slug: "professional-services",
    name: "Legal & Professional Services",
    headline: "EU AI Act for Legal & Professional Services",
    intro:
      "Document and contract-analysis AI is typically limited risk, but client-confidentiality and disclosure obligations are key.",
    commonHighRisk: ["Contract analysis", "Legal research", "Document review", "Outcome prediction"],
    obligations: [
      "Client confidentiality controls for AI tools",
      "Disclosure when AI assists client work",
      "Clear limitations disclaimers on AI outputs",
    ],
  },
  {
    slug: "education",
    name: "Education",
    headline: "EU AI Act for Education",
    intro:
      "AI in education and vocational training is an Annex III high-risk area when it affects access or assessment.",
    commonHighRisk: ["Automated grading", "Learning adaptation", "Student profiling", "Dropout prediction"],
    obligations: [
      "Student data protection",
      "Disclosure of AI tutoring / automated assessment",
      "Human review of automated assessment outcomes",
    ],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing & Industry",
    headline: "EU AI Act for Manufacturing",
    intro:
      "Industrial AI is often minimal risk, but safety-critical and worker-monitoring systems carry obligations.",
    commonHighRisk: ["Quality-control vision AI", "Predictive maintenance", "Worker safety monitoring"],
    obligations: [
      "Industrial AI safety documentation",
      "Worker-monitoring transparency",
      "Disclosure of predictive-maintenance AI where it affects people",
    ],
  },
  {
    slug: "public-sector",
    name: "Public Sector & Gov-Tech",
    headline: "EU AI Act for the Public Sector",
    intro:
      "Public-sector AI faces the highest scrutiny — biometric ID, benefits assessment and public-safety AI are tightly regulated.",
    commonHighRisk: ["Identity verification", "Benefits assessment", "Public-safety AI"],
    obligations: [
      "Biometric identification rules (Article 5 / Annex III)",
      "Democratic-process protections",
      "Fundamental Rights Impact Assessment",
    ],
  },
];

export function getSectorPage(slug: string) {
  return SECTOR_PAGES.find((s) => s.slug === slug);
}
