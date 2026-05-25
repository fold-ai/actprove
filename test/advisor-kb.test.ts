import { describe, it, expect } from "vitest";
import { retrieve } from "@/server/data/eu-ai-act-kb";
import { parseQuestions } from "@/server/services/questionnaire";

describe("EU AI Act KB retrieval", () => {
  it("retrieves Article 50 for transparency/chatbot questions", () => {
    const chunks = retrieve("do we need a transparency notice for our chatbot?");
    expect(chunks.some((c) => c.article.includes("Article 50"))).toBe(true);
  });

  it("retrieves deadline info for timeline questions", () => {
    const chunks = retrieve("what is the deadline in august 2026?");
    expect(chunks.some((c) => c.text.includes("2026"))).toBe(true);
  });

  it("always returns at least one chunk", () => {
    expect(retrieve("xyzzy nonsense").length).toBeGreaterThan(0);
  });
});

describe("questionnaire parsing", () => {
  it("splits lines and strips list markers", () => {
    const qs = parseQuestions("1. Do you use AI?\n- How is risk classified?\n• What data?");
    expect(qs).toHaveLength(3);
    expect(qs[0]).toBe("Do you use AI?");
  });

  it("ignores blank/short lines", () => {
    expect(parseQuestions("\n  \nok\nA real question here?")).toEqual([
      "A real question here?",
    ]);
  });
});
