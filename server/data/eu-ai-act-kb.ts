// Compact EU AI Act knowledge base for the AI Compliance Advisor's retrieval
// step. Each chunk is keyword-matched against the user's question and injected
// as grounded context with a citation (spec §9.1.3). For production, swap this
// for pgvector embeddings over the full regulation text.

export interface KbChunk {
  article: string;
  title: string;
  text: string;
  keywords: string[];
}

export const EU_AI_ACT_KB: KbChunk[] = [
  {
    article: "Article 3",
    title: "Definitions — provider vs deployer",
    text: "A 'provider' develops an AI system or has one developed and places it on the market under its own name. A 'deployer' uses an AI system under its authority. Most SMBs using third-party tools are deployers, with significantly lighter obligations than providers.",
    keywords: ["provider", "deployer", "definition", "role", "develop", "use"],
  },
  {
    article: "Article 4",
    title: "AI literacy",
    text: "Providers and deployers must ensure a sufficient level of AI literacy among staff dealing with AI systems, considering their technical knowledge, experience and the context of use. Mandatory since 2 February 2025.",
    keywords: ["literacy", "training", "staff", "competence", "article 4", "employees"],
  },
  {
    article: "Article 5",
    title: "Prohibited AI practices",
    text: "Bans unacceptable-risk practices: subliminal manipulation, exploitation of vulnerabilities, social scoring by public authorities, and real-time remote biometric identification in public spaces (with narrow exceptions). Prohibited since 2 February 2025.",
    keywords: ["prohibited", "banned", "biometric", "social scoring", "manipulation", "article 5"],
  },
  {
    article: "Article 6 + Annex III",
    title: "High-risk classification",
    text: "AI systems are high-risk if used in Annex III areas: biometrics, critical infrastructure, education, employment/worker management, access to essential services (incl. credit scoring), law enforcement, migration, and administration of justice.",
    keywords: ["high risk", "annex iii", "classification", "credit", "employment", "hiring", "article 6"],
  },
  {
    article: "Article 9",
    title: "Risk management system",
    text: "High-risk AI providers must establish, implement and maintain a risk management system across the system's lifecycle — identifying, evaluating and mitigating risks to health, safety and fundamental rights.",
    keywords: ["risk management", "article 9", "lifecycle", "mitigation", "high risk"],
  },
  {
    article: "Article 10",
    title: "Data and data governance",
    text: "Training, validation and testing data for high-risk systems must be relevant, representative, free of errors and complete, with appropriate data governance and bias examination.",
    keywords: ["data", "governance", "training data", "bias", "article 10"],
  },
  {
    article: "Article 13",
    title: "Transparency and provision of information",
    text: "High-risk AI must be sufficiently transparent to enable deployers to interpret output and use it appropriately, with clear instructions for use.",
    keywords: ["transparency", "instructions", "information", "article 13"],
  },
  {
    article: "Article 14",
    title: "Human oversight",
    text: "High-risk AI must be designed so humans can effectively oversee it — understanding its capacities and limits, monitoring operation, and intervening or stopping the system.",
    keywords: ["human oversight", "override", "intervene", "article 14", "monitoring"],
  },
  {
    article: "Article 26",
    title: "Obligations of deployers of high-risk AI",
    text: "Deployers must use high-risk AI per instructions, ensure human oversight, monitor operation, keep logs, and inform the provider/authority of risks or serious incidents. They must verify the provider's compliance (Art. 26(7)).",
    keywords: ["deployer", "obligations", "article 26", "logs", "monitoring", "vendor", "supplier"],
  },
  {
    article: "Article 50",
    title: "Transparency for certain AI systems",
    text: "Providers must ensure AI systems intended to interact with people (e.g. chatbots) disclose that users are interacting with AI. AI-generated or manipulated content (deepfakes, synthetic media) must be labelled as artificially generated.",
    keywords: ["transparency notice", "chatbot", "article 50", "disclose", "deepfake", "content", "label", "synthetic"],
  },
  {
    article: "Article 55",
    title: "SME support measures",
    text: "The Act provides support for SMEs and start-ups, including priority access to regulatory sandboxes and proportionate compliance expectations.",
    keywords: ["sme", "small business", "startup", "support", "sandbox", "article 55"],
  },
  {
    article: "Article 72",
    title: "Post-market monitoring",
    text: "Providers of high-risk AI must establish a post-market monitoring system to collect and review experience from systems in use.",
    keywords: ["post-market", "monitoring", "article 72"],
  },
  {
    article: "Article 99",
    title: "Penalties",
    text: "Fines can reach up to €35M or 7% of global annual turnover for prohibited practices, and up to €15M or 3% for other breaches. SMEs face proportionate caps.",
    keywords: ["penalties", "fines", "article 99", "turnover", "enforcement"],
  },
  {
    article: "Timeline",
    title: "Key deadlines",
    text: "Entered into force 1 Aug 2024. Prohibited practices and AI literacy from 2 Feb 2025. GPAI rules from 2 Aug 2025. High-risk obligations and Article 50 transparency from 2 Aug 2026. AI in regulated products from 2 Aug 2027.",
    keywords: ["deadline", "august 2026", "timeline", "when", "enforcement date", "2026"],
  },
];

/** Naive keyword retrieval — returns the top-N most relevant chunks. */
export function retrieve(question: string, n = 4): KbChunk[] {
  const q = question.toLowerCase();
  const scored = EU_AI_ACT_KB.map((c) => {
    let score = 0;
    for (const kw of c.keywords) if (q.includes(kw)) score += 2;
    // soft word overlap
    for (const w of q.split(/\W+/)) {
      if (w.length > 3 && c.text.toLowerCase().includes(w)) score += 0.5;
    }
    return { c, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  const top = scored.slice(0, n).map((s) => s.c);
  // Always include the high-risk + transparency anchors if nothing matched.
  return top.length ? top : EU_AI_ACT_KB.slice(3, 3 + n);
}
