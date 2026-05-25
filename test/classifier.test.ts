import { describe, it, expect } from "vitest";
import {
  classify,
  obligationsForTier,
  reviewCadenceMonths,
  type ClassifierInput,
} from "@/server/services/classifier";

const base: ClassifierInput = {
  name: "Test",
  category: "other",
  description: null,
  useCase: null,
  dataProcessed: [],
  affectsPeople: false,
  affectsEmployment: false,
  affectsCredit: false,
  affectsHealthcare: false,
  isPublicFacing: false,
  hasChatbotUi: false,
  hidesAiNature: false,
  generatesContent: false,
  isRealtimeBiometric: false,
};

describe("classify (rule-based decision tree)", () => {
  it("flags real-time biometric as prohibited", () => {
    expect(classify({ ...base, isRealtimeBiometric: true }).tier).toBe("prohibited");
  });

  it("flags employment AI as high risk", () => {
    expect(classify({ ...base, affectsEmployment: true }).tier).toBe("high_risk");
  });

  it("flags credit AI as high risk", () => {
    expect(classify({ ...base, affectsCredit: true }).tier).toBe("high_risk");
  });

  it("flags healthcare AI as high risk", () => {
    expect(classify({ ...base, affectsHealthcare: true }).tier).toBe("high_risk");
  });

  it("flags a chatbot as limited risk with Article 50", () => {
    const r = classify({ ...base, hasChatbotUi: true });
    expect(r.tier).toBe("limited_risk");
    expect(r.articles).toContain("Article 50");
  });

  it("flags public-facing content generation as limited risk", () => {
    expect(classify({ ...base, generatesContent: true }).tier).toBe("limited_risk");
  });

  it("defaults to minimal risk", () => {
    const r = classify(base);
    expect(r.tier).toBe("minimal_risk");
    expect(r.articles).toHaveLength(0);
  });

  it("prioritises prohibited over high risk", () => {
    expect(
      classify({ ...base, isRealtimeBiometric: true, affectsEmployment: true }).tier,
    ).toBe("prohibited");
  });

  it("prioritises high risk over limited risk", () => {
    expect(
      classify({ ...base, affectsCredit: true, hasChatbotUi: true }).tier,
    ).toBe("high_risk");
  });

  it("returns a confidence score in [0,1]", () => {
    const r = classify(base);
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });
});

describe("obligationsForTier", () => {
  it("gives high-risk systems the full obligation set", () => {
    const obs = obligationsForTier("high_risk");
    expect(obs.length).toBeGreaterThanOrEqual(7);
    expect(obs.some((o) => o.article === "Article 14")).toBe(true);
  });

  it("gives limited-risk systems Article 50 transparency obligations", () => {
    expect(obligationsForTier("limited_risk").every((o) => o.article === "Article 50" || !o.article)).toBe(true);
  });
});

describe("reviewCadenceMonths", () => {
  it("uses 3 months for high risk and 12 for minimal", () => {
    expect(reviewCadenceMonths("high_risk")).toBe(3);
    expect(reviewCadenceMonths("limited_risk")).toBe(6);
    expect(reviewCadenceMonths("minimal_risk")).toBe(12);
    expect(reviewCadenceMonths("prohibited")).toBe(0);
  });
});
