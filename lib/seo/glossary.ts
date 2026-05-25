export interface GlossaryTerm {
  term: string;
  definition: string;
}

/** EU AI Act glossary (spec §6.4.1) — long-tail SEO. */
export const GLOSSARY: GlossaryTerm[] = [
  { term: "AI system", definition: "Machine-based system that, for explicit or implicit objectives, infers from input how to generate outputs such as predictions, content, recommendations or decisions." },
  { term: "Provider", definition: "A natural or legal person that develops an AI system (or has one developed) and places it on the market under its own name or trademark." },
  { term: "Deployer", definition: "A natural or legal person using an AI system under its authority. Most SMBs using third-party tools are deployers." },
  { term: "Prohibited AI practice", definition: "Unacceptable-risk uses banned under Article 5, e.g. social scoring or real-time remote biometric identification in public spaces." },
  { term: "High-risk AI system", definition: "AI used in Annex III areas (employment, credit, healthcare, education, etc.) subject to the strictest obligations under Article 6." },
  { term: "Limited-risk AI system", definition: "AI that interacts with people or generates content, subject to transparency obligations under Article 50." },
  { term: "Minimal-risk AI system", definition: "AI with no mandatory obligations — most productivity and analytics tools. Voluntary codes of conduct are encouraged." },
  { term: "Annex III", definition: "The EU AI Act list of high-risk AI use cases across eight areas including employment, essential services and law enforcement." },
  { term: "Transparency notice", definition: "A disclosure (Article 50) informing users they are interacting with, or consuming content from, an AI system." },
  { term: "AI literacy", definition: "Article 4 obligation: ensuring staff dealing with AI have sufficient knowledge of its use, risks and limitations. Mandatory since 2 Feb 2025." },
  { term: "Human oversight", definition: "Article 14 requirement that high-risk AI is designed so people can understand, monitor and override it." },
  { term: "Risk management system", definition: "Article 9 process to identify, evaluate and mitigate risks of a high-risk AI system across its lifecycle." },
  { term: "Data governance", definition: "Article 10 requirements for relevant, representative, error-free training/validation/testing data with bias examination." },
  { term: "Conformity assessment", definition: "The process by which a high-risk AI provider demonstrates the system meets the Act's requirements before market placement." },
  { term: "FRIA", definition: "Fundamental Rights Impact Assessment (Article 27): an assessment of how a high-risk AI system may affect fundamental rights." },
  { term: "GPAI", definition: "General-Purpose AI model — a model with broad capabilities (e.g. large language models) subject to specific transparency rules from Aug 2025." },
  { term: "Post-market monitoring", definition: "Article 72 obligation for providers to collect and review real-world performance of high-risk AI after deployment." },
  { term: "Serious incident", definition: "An event causing or likely to cause death, serious harm, or infringement of fundamental rights, reportable under Article 73." },
  { term: "Notified body", definition: "An accredited organisation designated to carry out third-party conformity assessment of certain high-risk AI systems." },
  { term: "CE marking", definition: "The conformity mark high-risk AI systems must carry to be placed on the EU market once requirements are met." },
  { term: "EU database", definition: "The Article 71 public database where providers register stand-alone high-risk AI systems." },
  { term: "Market surveillance authority", definition: "The national body responsible for enforcing the EU AI Act within a member state." },
  { term: "Substantial modification", definition: "A change to a high-risk AI system after deployment that affects compliance, potentially requiring re-assessment." },
  { term: "Biometric identification", definition: "Automated recognition of individuals from biometric data; real-time remote use in public is largely prohibited." },
  { term: "Emotion recognition", definition: "AI inferring emotions; restricted in workplaces and education under the Act." },
  { term: "Deepfake", definition: "AI-generated or manipulated media that must be labelled as artificially generated under Article 50." },
  { term: "Article 5", definition: "Lists prohibited AI practices — applicable since 2 February 2025." },
  { term: "Article 6", definition: "Defines how AI systems are classified as high-risk." },
  { term: "Article 50", definition: "Transparency obligations for chatbots, deepfakes and AI-generated content." },
  { term: "Article 99", definition: "Sets penalties — up to €35M or 7% of global annual turnover for prohibited practices." },
  { term: "Regulatory sandbox", definition: "A controlled environment (Article 57+) where SMEs can test AI under regulator supervision." },
  { term: "DORA", definition: "Digital Operational Resilience Act — ICT-risk rules for EU financial entities, overlapping with the AI Act in finance." },
  { term: "NIS2", definition: "Network and Information Security Directive 2 — cybersecurity obligations for 18 critical sectors." },
  { term: "ISO 42001", definition: "International standard for AI Management Systems (AIMS); voluntary and certifiable on a 3-year cycle." },
  { term: "MDR crosswalk", definition: "Checking whether a healthcare AI system also falls under the EU Medical Device Regulation — double compliance." },
  { term: "Living register", definition: "An always-up-to-date record of an organisation's AI systems and their compliance status." },
  { term: "Trust Page", definition: "A public, shareable page summarising an organisation's AI compliance posture for clients and auditors." },
  { term: "Responsible person", definition: "The individual accountable for a specific AI system's compliance (supports Article 4 accountability)." },
  { term: "Shadow AI", definition: "AI tools used within an organisation without being declared or approved — a common compliance gap." },
  { term: "Compliance score", definition: "An indicator of progress toward compliance; not a guarantee of regulatory compliance." },
];

export function glossaryGroups() {
  const groups: Record<string, GlossaryTerm[]> = {};
  for (const t of [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term))) {
    const letter = t.term[0].toUpperCase();
    (groups[letter] ??= []).push(t);
  }
  return groups;
}
