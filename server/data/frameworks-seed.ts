// Regulation framework definitions + obligations for the multi-regulation
// module (spec §3). EU AI Act is the always-on primary framework (scored from
// the inventory); ISO 42001 / NIS2 / DORA are activatable secondary frameworks.

type Priority = "critical" | "high" | "medium" | "low";

export interface FrameworkObligationSeed {
  code: string;
  title: string;
  description?: string;
  appliesTo?: string;
  priority?: Priority;
  estimatedHours?: number;
  /** EU AI Act data that pre-fills this obligation (drives gap-analysis reuse). */
  prefillSource?: "inventory" | "risk_classification" | "responsible" | "literacy" | "policy" | "incident_log" | "supplier" | "evidence";
}

export interface FrameworkSeed {
  code: string;
  name: string;
  jurisdiction: string;
  description: string;
  enforcementDate?: string;
  recurring?: boolean;
  obligations: FrameworkObligationSeed[];
}

export const FRAMEWORK_SEED: FrameworkSeed[] = [
  {
    code: "iso_42001",
    name: "ISO/IEC 42001 (AI Management System)",
    jurisdiction: "International",
    description:
      "The international standard for AI Management Systems (AIMS). ~60% of its documentation overlaps with EU AI Act data you already collect. Certification runs on a 3-year cycle with annual surveillance audits.",
    recurring: true,
    obligations: [
      { code: "Clause 4.1", title: "Understand the organisation and its context", priority: "medium", estimatedHours: 3 },
      { code: "Clause 5.2", title: "Establish a documented AI policy", description: "Formal AI Management System policy.", priority: "high", estimatedHours: 4, prefillSource: "policy" },
      { code: "Clause 5.3", title: "Assign AI roles & responsibilities", priority: "high", estimatedHours: 2, prefillSource: "responsible" },
      { code: "Clause 6.1.2", title: "AI risk assessment & asset register", description: "Maintain an inventory of AI systems with risk assessment.", priority: "critical", estimatedHours: 4, prefillSource: "inventory" },
      { code: "Clause 6.1.3", title: "AI risk treatment", priority: "high", estimatedHours: 6, prefillSource: "risk_classification" },
      { code: "Clause 7.2", title: "Competence & AI literacy", priority: "high", estimatedHours: 3, prefillSource: "literacy" },
      { code: "Clause 8.3", title: "AI system impact assessment", priority: "high", estimatedHours: 5, prefillSource: "risk_classification" },
      { code: "Clause 8.4", title: "External provision (supplier assessment)", priority: "medium", estimatedHours: 4, prefillSource: "supplier" },
      { code: "Clause 9.1", title: "Monitoring, measurement & evidence", priority: "medium", estimatedHours: 4, prefillSource: "evidence" },
      { code: "Clause 9.2", title: "Internal audit", priority: "medium", estimatedHours: 6 },
      { code: "Clause 10.1", title: "Nonconformity & corrective action (incident log)", priority: "high", estimatedHours: 3, prefillSource: "incident_log" },
      { code: "Clause 10.2", title: "Continual improvement", priority: "low", estimatedHours: 2 },
    ],
  },
  {
    code: "nis2",
    name: "NIS2 Directive",
    jurisdiction: "European Union",
    description:
      "Network and Information Security Directive 2 — applies to 18 critical sectors. Requires cybersecurity risk-management, 24h/72h incident reporting, supply-chain security, and director accountability.",
    enforcementDate: "2024-10-17",
    obligations: [
      { code: "Art. 21(a)", title: "Risk analysis & information system security policies", priority: "critical", estimatedHours: 6 },
      { code: "Art. 21(b)", title: "Incident handling procedures", description: "24h early warning, 72h full report to national CSIRT.", priority: "critical", estimatedHours: 5, prefillSource: "incident_log" },
      { code: "Art. 21(c)", title: "Business continuity & backup", priority: "high", estimatedHours: 4 },
      { code: "Art. 21(d)", title: "Supply chain security", priority: "high", estimatedHours: 5, prefillSource: "supplier" },
      { code: "Art. 21(e)", title: "Security in acquisition, development & maintenance", priority: "medium", estimatedHours: 4 },
      { code: "Art. 21(f)", title: "Policies to assess effectiveness of measures", priority: "medium", estimatedHours: 3 },
      { code: "Art. 21(g)", title: "Cyber hygiene & training", priority: "medium", estimatedHours: 3, prefillSource: "literacy" },
      { code: "Art. 21(h)", title: "Cryptography & encryption policy", priority: "medium", estimatedHours: 3 },
      { code: "Art. 21(i)", title: "Access control & asset management", priority: "high", estimatedHours: 4 },
      { code: "Art. 20", title: "Management body accountability (director sign-off)", description: "Personal liability — a director must approve and oversee measures.", priority: "critical", estimatedHours: 1, prefillSource: "responsible" },
    ],
  },
  {
    code: "dora",
    name: "DORA (Digital Operational Resilience Act)",
    jurisdiction: "EU — Financial sector",
    description:
      "ICT risk management for financial entities. Frequently requested by fintech customers; overlaps with NIS2 and EU AI Act for AI used in financial decisions.",
    enforcementDate: "2025-01-17",
    obligations: [
      { code: "Art. 5", title: "ICT risk management framework", priority: "critical", estimatedHours: 8 },
      { code: "Art. 17", title: "ICT-related incident management process", priority: "high", estimatedHours: 5, prefillSource: "incident_log" },
      { code: "Art. 24", title: "Digital operational resilience testing", priority: "high", estimatedHours: 6 },
      { code: "Art. 28", title: "Third-party ICT risk (provider register)", priority: "high", estimatedHours: 5, prefillSource: "supplier" },
      { code: "Art. 45", title: "Information sharing on cyber threats", priority: "low", estimatedHours: 2 },
    ],
  },
];
