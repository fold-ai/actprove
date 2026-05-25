import type { RiskTier } from "@prisma/client";
import type { ClassifierInput, ClassificationResult } from "@/server/services/classifier";

/**
 * Sector-specific hard overrides (spec §5.2.2). Some sectors elevate systems to
 * high-risk regardless of the base classifier — e.g. any clinical AI in
 * healthcare. Returns null if no override applies.
 */
export function applySectorOverride(
  input: ClassifierInput,
  sector: string | null | undefined,
): ClassificationResult | null {
  if (!sector) return null;
  const uc = `${input.useCase ?? ""} ${input.description ?? ""}`.toLowerCase();
  const has = (...words: string[]) => words.some((w) => uc.includes(w));

  if (sector === "healthcare") {
    if (
      input.affectsHealthcare ||
      input.dataProcessed.includes("health") ||
      has("diagnos", "treatment", "triage", "prognos", "prescription", "clinical")
    ) {
      return {
        tier: "high_risk",
        rationale:
          "Healthcare sector rule: AI used in clinical or patient-facing contexts is treated as high-risk. Clinical validation evidence, an MDR crosswalk check, and a Fundamental Rights Impact Assessment are required.",
        articles: ["Article 6", "Annex III", "Article 14"],
        confidence: 0.92,
        classifiedBy: "template",
      };
    }
  }

  if (sector === "finance") {
    if (
      input.affectsCredit ||
      has("credit", "scoring", "underwrit", "loan", "insurance", "kyc")
    ) {
      return {
        tier: "high_risk",
        rationale:
          "Finance sector rule: AI involved in credit, scoring or financial decisions is high-risk (Annex III). Explainability, bias testing, and a documented human-review process for rejected applicants are required; a DORA crosswalk applies.",
        articles: ["Article 6", "Annex III", "Article 13"],
        confidence: 0.9,
        classifiedBy: "template",
      };
    }
  }

  if (sector === "hr") {
    if (input.affectsEmployment || has("hiring", "recruit", "cv ", "resume", "screening", "candidate")) {
      return {
        tier: "high_risk",
        rationale:
          "HR sector rule: AI used in recruitment or worker management is high-risk (Annex III). CV-screening transparency, anti-discrimination testing, and a human-review path are required.",
        articles: ["Article 6", "Annex III", "Article 22 GDPR"],
        confidence: 0.9,
        classifiedBy: "template",
      };
    }
  }

  return null;
}

// ─────────────────────── Custom risk rules engine (§10.4) ───────────────────

export interface CustomRuleCondition {
  category?: string;
  dataProcessed?: { contains: string };
  affectsPeople?: boolean;
  affectsEmployment?: boolean;
  affectsCredit?: boolean;
  affectsHealthcare?: boolean;
  isPublicFacing?: boolean;
  hasChatbotUi?: boolean;
  generatesContent?: boolean;
}

export interface CustomRule {
  name: string;
  condition: CustomRuleCondition;
  resultingTier: RiskTier;
  internalLabel: string | null;
  priority: number;
}

function matches(input: ClassifierInput, c: CustomRuleCondition): boolean {
  if (c.category && c.category !== input.category) return false;
  if (c.dataProcessed && !input.dataProcessed.includes(c.dataProcessed.contains))
    return false;
  const bool: (keyof CustomRuleCondition)[] = [
    "affectsPeople",
    "affectsEmployment",
    "affectsCredit",
    "affectsHealthcare",
    "isPublicFacing",
    "hasChatbotUi",
    "generatesContent",
  ];
  for (const k of bool) {
    if (c[k] !== undefined && Boolean((input as never)[k]) !== c[k]) return false;
  }
  return true;
}

/**
 * Applies org-specific custom rules on top of the EU AI Act classification,
 * returning a separate internal classification (spec §10.4). Highest-priority
 * matching rule wins.
 */
export function applyCustomRules(
  input: ClassifierInput,
  rules: CustomRule[],
): { internalTier: RiskTier; internalLabel: string } | null {
  const matched = rules
    .filter((r) => matches(input, r.condition))
    .sort((a, b) => b.priority - a.priority);
  if (matched.length === 0) return null;
  const top = matched[0];
  return {
    internalTier: top.resultingTier,
    internalLabel: top.internalLabel ?? top.name,
  };
}
