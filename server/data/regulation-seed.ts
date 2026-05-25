// Historical EU AI Act regulation updates used to seed the Regulation Monitor.

export interface RegulationSeed {
  title: string;
  summary: string;
  fullContent?: string;
  sourceUrl?: string;
  regulation:
    | "eu_ai_act"
    | "nis2"
    | "dora"
    | "iso42001"
    | "gdpr"
    | "cra";
  severity: "critical" | "high" | "medium" | "info";
  affectsRiskTiers: string[];
  publishedAt: string; // ISO date
}

export const REGULATION_SEED: RegulationSeed[] = [
  {
    title: "AI literacy obligations now mandatory (Article 4)",
    summary:
      "Since 2 February 2025, all organisations deploying or providing AI must ensure staff have adequate AI literacy. Document your training to demonstrate compliance.",
    regulation: "eu_ai_act",
    severity: "high",
    affectsRiskTiers: ["minimal_risk", "limited_risk", "high_risk"],
    publishedAt: "2025-02-02",
    sourceUrl: "https://artificialintelligenceact.eu/article/4/",
  },
  {
    title: "Prohibited AI practices are now banned (Article 5)",
    summary:
      "As of 2 February 2025, unacceptable-risk practices such as social scoring and real-time remote biometric surveillance are prohibited across the EU.",
    regulation: "eu_ai_act",
    severity: "critical",
    affectsRiskTiers: ["prohibited"],
    publishedAt: "2025-02-02",
    sourceUrl: "https://artificialintelligenceact.eu/article/5/",
  },
  {
    title: "GPAI model rules and governance provisions apply",
    summary:
      "From 2 August 2025, obligations for general-purpose AI models and the EU AI Act governance framework took effect.",
    regulation: "eu_ai_act",
    severity: "medium",
    affectsRiskTiers: ["limited_risk", "high_risk"],
    publishedAt: "2025-08-02",
  },
  {
    title: "Countdown: full enforcement on 2 August 2026",
    summary:
      "High-risk AI system obligations and Article 50 transparency requirements become fully enforceable. Ensure your high-risk and limited-risk systems are documented and compliant.",
    regulation: "eu_ai_act",
    severity: "high",
    affectsRiskTiers: ["limited_risk", "high_risk"],
    publishedAt: "2026-02-02",
  },
  {
    title: "NIS2 transposition affects digital service providers",
    summary:
      "Member states continue to transpose NIS2. If you provide digital services, review your cybersecurity risk-management and incident-reporting obligations.",
    regulation: "nis2",
    severity: "info",
    affectsRiskTiers: [],
    publishedAt: "2025-10-17",
  },
  {
    title: "Synthetic media labelling guidance expected",
    summary:
      "Ahead of the 2 December 2026 deadline, providers of generative AI should prepare to label AI-generated content (deepfakes, synthetic media).",
    regulation: "eu_ai_act",
    severity: "medium",
    affectsRiskTiers: ["limited_risk"],
    publishedAt: "2026-03-01",
  },
];
