import Anthropic from "@anthropic-ai/sdk";
import type { DocumentType } from "@prisma/client";

export interface GenOrg {
  name: string;
  country: string;
}
export interface GenSystem {
  name: string;
  vendor: string | null;
  description: string | null;
  useCase: string | null;
  hasChatbotUi: boolean;
  generatesContent: boolean;
  riskTier: string | null;
}

export const DOCUMENT_TYPES: {
  type: DocumentType;
  title: string;
  description: string;
  scope: "system" | "org";
}[] = [
  {
    type: "transparency_notice",
    title: "Transparency Notice",
    description:
      "Informs users they're interacting with AI (Article 50). For public-facing AI.",
    scope: "system",
  },
  {
    type: "ai_usage_policy",
    title: "AI Usage Policy",
    description:
      "Internal policy governing how employees may use AI tools.",
    scope: "org",
  },
  {
    type: "risk_register",
    title: "Risk Register",
    description: "Structured table of all AI systems with risk classifications.",
    scope: "org",
  },
  {
    type: "ai_literacy_attestation",
    title: "AI Literacy Attestation",
    description: "Records Article 4 staff training compliance.",
    scope: "org",
  },
  {
    type: "vendor_checklist",
    title: "Vendor Compliance Checklist",
    description: "Verify each vendor has met their EU AI Act obligations.",
    scope: "org",
  },
  {
    type: "compliance_summary",
    title: "Compliance Summary Report",
    description: "Executive summary of overall compliance posture.",
    scope: "org",
  },
  {
    type: "fria",
    title: "Fundamental Rights Impact Assessment",
    description:
      "Assesses how a high-risk AI system affects fundamental rights (Article 27). For high-risk deployers.",
    scope: "system",
  },
  {
    type: "incident_log",
    title: "Incident Log Template",
    description:
      "Template for recording and reporting AI incidents or near-misses (high-risk monitoring).",
    scope: "org",
  },
];

function p(text: string) {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

// ─────────────────────── Template fallbacks ───────────────────────

function templateTransparency(org: GenOrg, sys?: GenSystem): string {
  const name = sys?.name ?? "our AI system";
  return `<h1>AI Transparency Notice</h1>
${p(`${org.name} uses ${name} to support and interact with you. In line with Article 50 of the EU AI Act (Regulation 2024/1689), we want to be clear and transparent about this.`)}
<h2>You are interacting with an AI system</h2>
${p(`When you use ${name}, you are interacting with an artificial intelligence system, not a human. ${sys?.description ?? "It assists us in providing our services."}`)}
<h2>What this means for you</h2>
<ul>
<li>Responses may be automatically generated.</li>
<li>You can request human assistance at any time.</li>
<li>We do not use this system to make legally significant automated decisions about you without human oversight.</li>
</ul>
<h2>Your rights</h2>
${p("You have the right to be informed, to request human review, and to contact us with any questions about how we use AI.")}
${p(`<em>${org.name} · This notice does not constitute legal advice.</em>`)}`;
}

function templateUsagePolicy(org: GenOrg, systems: GenSystem[]): string {
  const list = systems.map((s) => `<li>${s.name}${s.vendor ? ` (${s.vendor})` : ""}</li>`).join("");
  return `<h1>AI Usage Policy</h1>
${p(`This policy governs how employees of ${org.name} may use AI-powered tools in the course of their work, in accordance with the EU AI Act (Regulation 2024/1689) and Article 4 AI literacy obligations.`)}
<h2>1. Scope</h2>
${p("This policy applies to all employees, contractors and temporary staff who use AI tools provided or sanctioned by the company.")}
<h2>2. Approved AI tools</h2>
<ul>${list || "<li>To be completed</li>"}</ul>
<h2>3. Acceptable use</h2>
<ul>
<li>Use AI tools only for legitimate business purposes.</li>
<li>Always review AI-generated output before relying on or publishing it.</li>
<li>Maintain human oversight for any decision affecting individuals.</li>
</ul>
<h2>4. Data handling</h2>
<ul>
<li>Do not input personal, confidential or regulated data into AI tools that have not been approved for such use.</li>
<li>Respect data minimisation and the company's data protection policy.</li>
</ul>
<h2>5. Accountability</h2>
${p("Each AI system has a designated responsible person. Misuse may result in disciplinary action. Questions should be directed to your manager or the compliance lead.")}
${p(`<em>${org.name} · This policy does not constitute legal advice.</em>`)}`;
}

function templateGeneric(org: GenOrg, type: DocumentType): string {
  const meta = DOCUMENT_TYPES.find((d) => d.type === type);
  return `<h1>${meta?.title ?? "Compliance Document"}</h1>
${p(`Prepared for ${org.name} (${org.country}).`)}
${p(meta?.description ?? "")}
${p("This is a starting template. Edit the content to reflect your organisation's specific circumstances, then save and generate a PDF.")}
${p(`<em>This document does not constitute legal advice.</em>`)}`;
}

function fallback(
  type: DocumentType,
  org: GenOrg,
  systems: GenSystem[],
): string {
  switch (type) {
    case "transparency_notice":
      return templateTransparency(org, systems[0]);
    case "ai_usage_policy":
      return templateUsagePolicy(org, systems);
    default:
      return templateGeneric(org, type);
  }
}

// ─────────────────────── Claude generation ───────────────────────

const SYSTEM_PROMPTS: Partial<Record<DocumentType, string>> = {
  transparency_notice: `You are a legal compliance expert specialising in the EU AI Act (Regulation 2024/1689). Generate a Transparency Notice for a website/product that uses an AI system, compliant with Article 50. Write in plain, accessible language with no legal jargon. Return clean semantic HTML using <h1>, <h2>, <p>, <ul>, <li> only. No preamble, no markdown, no <html> wrapper.`,
  ai_usage_policy: `You are an EU AI Act compliance expert. Generate an internal AI Usage Policy for an SMB, covering acceptable use, data handling, human oversight and accountability (Article 4 literacy). Return clean semantic HTML (<h1>,<h2>,<p>,<ul>,<li>). No preamble or markdown.`,
  compliance_summary: `You are an EU AI Act compliance expert. Generate an executive Compliance Summary Report suitable for a board or client. Reference the organisation's AI systems and risk posture. Return clean semantic HTML. No preamble or markdown.`,
  vendor_checklist: `You are an EU AI Act compliance expert. Generate a Vendor Compliance Checklist to help a deployer verify each AI vendor has met their Article 26(7) obligations. Return clean semantic HTML. No preamble or markdown.`,
  ai_literacy_attestation: `You are an EU AI Act compliance expert. Generate an AI Literacy Attestation document proving Article 4 compliance for an SMB. Return clean semantic HTML. No preamble or markdown.`,
  fria: `You are an EU AI Act compliance expert. Generate a Fundamental Rights Impact Assessment (FRIA) for a high-risk AI system per Article 27: describe the deployment process, affected persons, risks to fundamental rights, mitigation measures, and human oversight. Return clean semantic HTML. No preamble or markdown.`,
  incident_log: `You are an EU AI Act compliance expert. Generate an AI Incident Log template for recording and reporting AI system incidents/near-misses (Article 73 serious-incident reporting). Include columns/fields for date, system, description, severity, affected persons, root cause, corrective action, and reporting status. Return clean semantic HTML. No preamble or markdown.`,
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Write in clear, professional British English.",
  de: "Schreiben Sie auf Deutsch. Verwenden Sie professionelle, rechtlich korrekte Sprache.",
  fr: "Rédigez en français. Utilisez un langage professionnel et juridiquement correct.",
  pl: "Pisz po polsku. Używaj profesjonalnego, poprawnego języka prawniczego.",
  nl: "Schrijf in het Nederlands. Gebruik professioneel, juridisch correct taalgebruik.",
  es: "Redacte en español con lenguaje profesional y jurídicamente correcto.",
  it: "Scrivi in italiano con linguaggio professionale e giuridicamente corretto.",
};

export async function generateDocument(opts: {
  type: DocumentType;
  org: GenOrg;
  systems: GenSystem[];
  customNotes?: string;
  locale?: string;
}): Promise<{ html: string; generatedBy: "ai" | "template" }> {
  const { type, org, systems, customNotes, locale = "en" } = opts;
  const fb = fallback(type, org, systems);

  const systemPrompt = SYSTEM_PROMPTS[type];
  if (!systemPrompt || !process.env.ANTHROPIC_API_KEY) {
    return { html: fb, generatedBy: "template" };
  }
  const langInstruction =
    LANGUAGE_INSTRUCTIONS[locale] ?? LANGUAGE_INSTRUCTIONS.en;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const sysSummary = systems
      .map(
        (s) =>
          `- ${s.name}${s.vendor ? ` by ${s.vendor}` : ""} | risk: ${s.riskTier ?? "n/a"} | ${s.useCase ?? s.description ?? ""}`,
      )
      .join("\n");

    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2500,
      system: `${systemPrompt}\nLanguage instruction: ${langInstruction} (organisation country: ${org.country}).`,
      messages: [
        {
          role: "user",
          content: `Organisation: ${org.name} (${org.country})
AI systems:
${sysSummary || "(none provided)"}
${customNotes ? `Custom notes: ${customNotes}` : ""}`,
        },
      ],
    });
    const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const html = text.replace(/```html|```/g, "").trim();
    return { html: html || fb, generatedBy: html ? "ai" : "template" };
  } catch (err) {
    console.error("[document-generator] Claude failed, using template", err);
    return { html: fb, generatedBy: "template" };
  }
}

/** Wraps document HTML in a branded shell for PDF rendering. */
export function documentPdfHtml(org: GenOrg, title: string, contentHtml: string) {
  const now = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { font-family:'Helvetica Neue',Arial,sans-serif; }
    body { color:#1A252F; font-size:12px; line-height:1.6; }
    h1 { color:#1B4F72; font-size:22px; }
    h2 { color:#1B4F72; font-size:15px; margin-top:18px; }
    .header { border-bottom:3px solid #1B4F72; padding-bottom:8px; margin-bottom:16px; }
    .header .org { font-weight:bold; color:#1B4F72; }
    ul { padding-left:18px; }
  </style></head><body>
    <div class="header"><span class="org">${org.name}</span> · ${title} · ${now}</div>
    ${contentHtml}
  </body></html>`;
}

// ─────────────── Smart document improvement suggestions (§9.3) ───────────────

const HEURISTICS: { type: DocumentType; test: (html: string) => boolean; suggestion: string }[] = [
  {
    type: "transparency_notice",
    test: (h) => !/dpo|data protection officer|contact/i.test(h),
    suggestion:
      "Add contact details for your DPO or a responsible contact — Article 50 expects users to know who to reach.",
  },
  {
    type: "transparency_notice",
    test: (h) => !/human|review|assistance/i.test(h),
    suggestion: "Mention that users can request human review or assistance.",
  },
  {
    type: "ai_usage_policy",
    test: (h) => !/personal (ai )?account|shadow/i.test(h),
    suggestion:
      "Cover employees using personal AI accounts for work — a common gap in AI usage policies.",
  },
  {
    type: "ai_usage_policy",
    test: (h) => !/data|confidential/i.test(h),
    suggestion: "Add a section on data handling and confidential information.",
  },
];

/**
 * Suggests improvements to a generated document (spec §9.3). Uses Claude when
 * available, otherwise rule-based heuristics so it always returns something.
 */
export async function suggestImprovements(
  type: DocumentType,
  contentHtml: string,
): Promise<string[]> {
  const heuristic = HEURISTICS.filter(
    (h) => h.type === type && h.test(contentHtml),
  ).map((h) => h.suggestion);

  if (!process.env.ANTHROPIC_API_KEY) return heuristic;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system:
        "You are an EU AI Act compliance reviewer. Given a compliance document, return up to 4 concise, specific improvement suggestions as a JSON array of strings. Reference articles where relevant. Return ONLY the JSON array.",
      messages: [
        { role: "user", content: `Document type: ${type}\n\n${contentHtml.slice(0, 6000)}` },
      ],
    });
    const text = msg.content[0]?.type === "text" ? msg.content[0].text : "[]";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (Array.isArray(parsed)) return parsed.slice(0, 5).map(String);
    return heuristic;
  } catch (err) {
    console.error("[suggestImprovements] Claude failed", err);
    return heuristic;
  }
}
