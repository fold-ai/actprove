import Anthropic from "@anthropic-ai/sdk";
import { retrieve } from "@/server/data/eu-ai-act-kb";

export interface Citation {
  article: string;
  title: string;
}

export interface AdvisorAnswer {
  answer: string;
  citations: Citation[];
}

/**
 * Answers a compliance question grounded in (a) retrieved EU AI Act passages and
 * (b) the organisation's own compliance context (spec §9.1). Falls back to a
 * passage-based summary when Claude is not configured.
 */
export async function answerQuestion(
  question: string,
  orgContext: string,
): Promise<AdvisorAnswer> {
  const chunks = retrieve(question);
  const citations = chunks.map((c) => ({ article: c.article, title: c.title }));
  const kb = chunks
    .map((c) => `[${c.article} — ${c.title}] ${c.text}`)
    .join("\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    const answer =
      `Based on the EU AI Act:\n\n` +
      chunks.map((c) => `• ${c.article} — ${c.title}: ${c.text}`).join("\n\n") +
      `\n\nConnect an Anthropic API key for answers tailored to your specific systems. For a legal opinion, consult a qualified AI law practitioner.`;
    return { answer, citations };
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 700,
      system: `You are ActProve's AI Compliance Advisor — an EU AI Act expert answering questions about THIS specific organisation. Use the provided regulation passages and the organisation's compliance context. Be concrete, reference the org's own systems by name when relevant, and cite article numbers inline. If a legal opinion is required, recommend consulting a qualified AI law practitioner. Never invent facts. Keep answers under 200 words.`,
      messages: [
        {
          role: "user",
          content: `Relevant EU AI Act passages:\n${kb}\n\nOrganisation compliance context:\n${orgContext}\n\nQuestion: ${question}`,
        },
      ],
    });
    const answer =
      msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";
    return { answer: answer || "I couldn't generate an answer — please try rephrasing.", citations };
  } catch (err) {
    console.error("[advisor] Claude failed", err);
    return {
      answer:
        "I'm having trouble reaching the AI service right now. Here are the relevant passages:\n\n" +
        chunks.map((c) => `• ${c.article}: ${c.text}`).join("\n\n"),
      citations,
    };
  }
}

export const SUGGESTED_QUESTIONS = [
  "Are we compliant with Article 50?",
  "What do we need to do before August 2, 2026?",
  "What's the difference between provider and deployer for us?",
  "We just started using a new HR AI tool — what do we need to do?",
  "Which of our systems are high-risk and why?",
];
