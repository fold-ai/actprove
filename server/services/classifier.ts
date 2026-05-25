import Anthropic from "@anthropic-ai/sdk";
import type { RiskTier } from "@prisma/client";

/** The subset of AI-system fields the classifier reasons over. */
export interface ClassifierInput {
  name: string;
  category: string;
  description?: string | null;
  useCase?: string | null;
  dataProcessed: string[];
  affectsPeople: boolean;
  affectsEmployment: boolean;
  affectsCredit: boolean;
  affectsHealthcare: boolean;
  isPublicFacing: boolean;
  hasChatbotUi: boolean;
  hidesAiNature: boolean;
  generatesContent: boolean;
  isRealtimeBiometric: boolean;
}

export interface ClassificationResult {
  tier: RiskTier;
  rationale: string;
  articles: string[];
  confidence: number;
  classifiedBy: "ai" | "manual" | "template";
}

/**
 * Rule-based EU AI Act risk classifier (spec §5.2.1). Deterministic and
 * instant; returns a confidence score so the caller can decide whether to
 * escalate borderline cases to Claude via {@link classifyWithAI}.
 */
export function classify(input: ClassifierInput): ClassificationResult {
  // 1 — Prohibited: real-time remote biometric surveillance, social scoring.
  if (input.isRealtimeBiometric) {
    return {
      tier: "prohibited",
      rationale:
        "This system performs real-time biometric identification or surveillance of natural persons, which is an unacceptable-risk practice banned under Article 5 of the EU AI Act. Use must stop immediately.",
      articles: ["Article 5"],
      confidence: 0.95,
      classifiedBy: "template",
    };
  }

  // 2 — High risk: Annex III consequential decisions about people.
  const highRiskReasons: string[] = [];
  if (input.affectsEmployment)
    highRiskReasons.push("employment, recruitment or worker management");
  if (input.affectsCredit)
    highRiskReasons.push("credit scoring or access to essential financial services");
  if (input.affectsHealthcare)
    highRiskReasons.push("healthcare or medical decision-making");

  if (highRiskReasons.length > 0) {
    return {
      tier: "high_risk",
      rationale: `This system is used in ${highRiskReasons.join(
        " and ",
      )}, an Annex III high-risk area. High-risk obligations apply: risk management, technical documentation, human oversight, logging and conformity assessment.`,
      articles: ["Article 6", "Article 9", "Article 14", "Annex III"],
      confidence: 0.85,
      classifiedBy: "template",
    };
  }

  // 3 — Limited risk: transparency obligations (chatbots, AI content).
  const limitedReasons: string[] = [];
  if (input.hasChatbotUi) limitedReasons.push("presents a conversational AI interface");
  if (input.isPublicFacing) limitedReasons.push("interacts directly with end users");
  if (input.generatesContent) limitedReasons.push("generates content for people");
  if (input.hidesAiNature) limitedReasons.push("may obscure that users are interacting with AI");

  if (limitedReasons.length > 0) {
    return {
      tier: "limited_risk",
      rationale: `This system ${limitedReasons.join(
        ", ",
      )}. Transparency obligations under Article 50 apply — users must be clearly informed they are interacting with, or consuming content from, an AI system.`,
      articles: ["Article 50"],
      // Lower confidence when it could plausibly be minimal (no personal data).
      confidence:
        input.dataProcessed.includes("none") || input.dataProcessed.length === 0
          ? 0.7
          : 0.82,
      classifiedBy: "template",
    };
  }

  // 4 — Minimal risk: everything else.
  return {
    tier: "minimal_risk",
    rationale:
      "This system does not make consequential decisions about people, is not public-facing, and does not generate content for an audience. It falls under minimal risk with no mandatory obligations — voluntary codes of conduct are encouraged.",
    articles: [],
    confidence: 0.8,
    classifiedBy: "template",
  };
}

const AI_SYSTEM_PROMPT = `You are an EU AI Act compliance expert. Classify the following AI system into exactly one of four tiers: prohibited, high_risk, limited_risk, minimal_risk. Base your classification strictly on the EU AI Act (Regulation 2024/1689). Return ONLY valid JSON with this shape: {"tier": string, "rationale": string, "key_articles": string[], "confidence_score": number}. The rationale must be 2-3 plain-English sentences. confidence_score is between 0 and 1.`;

/**
 * Claude-enhanced classification for borderline cases (spec §5.2.2). Falls back
 * to the rule-based result if the API key is absent or the call fails.
 */
export async function classifyWithAI(
  input: ClassifierInput,
): Promise<ClassificationResult> {
  const fallback = classify(input);
  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      system: AI_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `System name: ${input.name}
Category: ${input.category}
Description: ${input.description ?? "—"}
Use case: ${input.useCase ?? "—"}
Data processed: ${input.dataProcessed.join(", ") || "none"}
Affects people: ${input.affectsPeople}
Affects employment: ${input.affectsEmployment}
Affects credit: ${input.affectsCredit}
Affects healthcare: ${input.affectsHealthcare}
Public facing: ${input.isPublicFacing}
Has chatbot UI: ${input.hasChatbotUi}
Generates content: ${input.generatesContent}
Hides AI nature: ${input.hidesAiNature}
Real-time biometric: ${input.isRealtimeBiometric}`,
        },
      ],
    });

    const text =
      msg.content[0]?.type === "text" ? msg.content[0].text : "{}";
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());
    const tier = json.tier as RiskTier;
    const valid: RiskTier[] = [
      "prohibited",
      "high_risk",
      "limited_risk",
      "minimal_risk",
    ];
    if (!valid.includes(tier)) return fallback;

    return {
      tier,
      rationale: json.rationale ?? fallback.rationale,
      articles: Array.isArray(json.key_articles)
        ? json.key_articles
        : fallback.articles,
      confidence:
        typeof json.confidence_score === "number"
          ? json.confidence_score
          : fallback.confidence,
      classifiedBy: "ai",
    };
  } catch (err) {
    console.error("[classifier] Claude call failed, using rule-based", err);
    return fallback;
  }
}

/**
 * Classify, escalating to Claude only when the rule-based confidence is low
 * (spec §5.2: "if confidence < 0.8, call Claude API for validation").
 */
export async function classifySystem(
  input: ClassifierInput,
  { useAI = true }: { useAI?: boolean } = {},
): Promise<ClassificationResult> {
  const base = classify(input);
  if (useAI && base.confidence < 0.8 && process.env.ANTHROPIC_API_KEY) {
    return classifyWithAI(input);
  }
  return base;
}

// ─────────────────────── Obligations checklists (§5.3.2) ───────────────────

export interface ObligationItem {
  label: string;
  article?: string;
}

export function obligationsForTier(tier: RiskTier): ObligationItem[] {
  switch (tier) {
    case "prohibited":
      return [
        { label: "Stop using this system immediately", article: "Article 5" },
        { label: "Document decommissioning and notify stakeholders" },
      ];
    case "high_risk":
      return [
        { label: "Risk management system documented", article: "Article 9" },
        { label: "Technical documentation prepared", article: "Annex IV" },
        { label: "Training data governance documented", article: "Article 10" },
        { label: "Human oversight mechanism in place", article: "Article 14" },
        { label: "Accuracy and robustness testing done", article: "Article 15" },
        { label: "Log retention (min. 6 months) configured", article: "Article 12" },
        { label: "Post-market monitoring plan in place", article: "Article 72" },
        { label: "Fundamental Rights Impact Assessment (if required)", article: "Article 27" },
      ];
    case "limited_risk":
      return [
        {
          label: "Transparency notice placed on all user-facing AI interactions",
          article: "Article 50",
        },
        { label: "AI-generated content labeled where required", article: "Article 50" },
        { label: "Users informed they are interacting with AI", article: "Article 50" },
      ];
    case "minimal_risk":
      return [
        { label: "No mandatory obligations — voluntary code of conduct encouraged" },
      ];
  }
}

/** Recommended review cadence in months (spec §6.4). */
export function reviewCadenceMonths(tier: RiskTier): number {
  switch (tier) {
    case "high_risk":
      return 3;
    case "limited_risk":
      return 6;
    case "minimal_risk":
      return 12;
    case "prohibited":
      return 0;
  }
}
