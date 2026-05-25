import Anthropic from "@anthropic-ai/sdk";

export interface QAItem {
  question: string;
  answer: string;
  confidence: "high" | "medium" | "low";
}

interface Context {
  orgName: string;
  country: string;
  systemsSummary: string;
  riskSummary: string;
  documentsSummary: string;
}

/** Splits pasted text into individual questions. */
export function parseQuestions(text: string): string[] {
  return text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(\d+[.)]|[-*•])\s*/, "").trim())
    .filter((l) => l.length > 4);
}

/** Generates answers for each question grounded in the org's compliance data. */
export async function generateAnswers(
  questions: string[],
  ctx: Context,
): Promise<QAItem[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return questions.map((q) => ({
      question: q,
      answer:
        "Connect an Anthropic API key to auto-generate answers from your compliance data. Meanwhile, answer based on your AI inventory and risk register.",
      confidence: "low" as const,
    }));
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const results: QAItem[] = [];

  for (const q of questions) {
    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        system: `You are an EU AI Act compliance expert for a company called ${ctx.orgName}. Answer the compliance question based on the company's verified compliance data. Be factual, specific and professional (2-4 sentences). If data is insufficient, note what information would complete the answer. Return JSON: {"answer": string, "confidence": "high"|"medium"|"low"}.`,
        messages: [
          {
            role: "user",
            content: `Company context:
- AI systems: ${ctx.systemsSummary}
- Risk classifications: ${ctx.riskSummary}
- Documents: ${ctx.documentsSummary}
- Country: ${ctx.country}

Question: ${q}`,
          },
        ],
      });
      const text = msg.content[0]?.type === "text" ? msg.content[0].text : "{}";
      const json = JSON.parse(text.replace(/```json|```/g, "").trim());
      results.push({
        question: q,
        answer: json.answer ?? "",
        confidence: ["high", "medium", "low"].includes(json.confidence)
          ? json.confidence
          : "medium",
      });
    } catch (err) {
      console.error("[questionnaire] answer failed", err);
      results.push({
        question: q,
        answer: "Could not generate an answer automatically — please complete manually.",
        confidence: "low",
      });
    }
  }
  return results;
}
