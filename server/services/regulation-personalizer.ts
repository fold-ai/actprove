import Anthropic from "@anthropic-ai/sdk";

interface PersonalizeInput {
  orgName: string;
  country: string;
  update: { title: string; summary: string; affectsRiskTiers: string[] };
  affectedSystems: { name: string; riskTier: string | null }[];
}

/**
 * Produces a 2-3 sentence "How this affects you" explanation for a regulation
 * update, grounded in the org's actual AI systems (spec §9.1.2). Falls back to a
 * deterministic message when Claude is unavailable.
 */
export async function personalize(input: PersonalizeInput): Promise<string> {
  const { affectedSystems, update, orgName } = input;

  const fallback =
    affectedSystems.length > 0
      ? `This update touches ${affectedSystems.length} of your registered system(s)${
          affectedSystems[0]
            ? ` including ${affectedSystems
                .slice(0, 3)
                .map((s) => s.name)
                .join(", ")}`
            : ""
        }. Review their classification and obligations to stay compliant.`
      : "Based on your current inventory, no registered systems fall directly under this update — but keep your register up to date as new tools are added.";

  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      system:
        "Given a regulation update and an organisation's AI systems, explain in 2-3 sentences how this update specifically affects them and what concrete action they need to take. Be specific and reference their system names if relevant. Plain English. No preamble.",
      messages: [
        {
          role: "user",
          content: `Organisation: ${orgName}
Update: ${update.title} — ${update.summary}
Affected risk tiers: ${update.affectsRiskTiers.join(", ") || "none specified"}
Their relevant systems: ${
            affectedSystems.map((s) => `${s.name} (${s.riskTier ?? "?"})`).join(", ") ||
            "none"
          }`,
        },
      ],
    });
    const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";
    return text || fallback;
  } catch (err) {
    console.error("[personalizer] Claude failed", err);
    return fallback;
  }
}
