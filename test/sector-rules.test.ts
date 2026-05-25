import { describe, it, expect } from "vitest";
import {
  applySectorOverride,
  applyCustomRules,
  type CustomRule,
} from "@/server/services/sector-rules";
import type { ClassifierInput } from "@/server/services/classifier";

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

describe("applySectorOverride", () => {
  it("returns null when no sector is set", () => {
    expect(applySectorOverride(base, null)).toBeNull();
  });

  it("forces clinical healthcare AI to high risk", () => {
    const r = applySectorOverride(
      { ...base, useCase: "assists diagnosis of patients" },
      "healthcare",
    );
    expect(r?.tier).toBe("high_risk");
  });

  it("forces credit AI to high risk in finance", () => {
    const r = applySectorOverride({ ...base, affectsCredit: true }, "finance");
    expect(r?.tier).toBe("high_risk");
  });

  it("forces recruitment AI to high risk in HR", () => {
    const r = applySectorOverride(
      { ...base, useCase: "screening of candidate resumes" },
      "hr",
    );
    expect(r?.tier).toBe("high_risk");
  });

  it("does not override unrelated systems", () => {
    expect(applySectorOverride(base, "healthcare")).toBeNull();
  });
});

describe("applyCustomRules", () => {
  const rule: CustomRule = {
    name: "Customer data policy",
    condition: { dataProcessed: { contains: "personal" }, isPublicFacing: true },
    resultingTier: "high_risk",
    internalLabel: "High Internal Risk",
    priority: 10,
  };

  it("matches a rule and returns internal tier", () => {
    const r = applyCustomRules(
      { ...base, dataProcessed: ["personal"], isPublicFacing: true },
      [rule],
    );
    expect(r?.internalTier).toBe("high_risk");
    expect(r?.internalLabel).toBe("High Internal Risk");
  });

  it("returns null when no rule matches", () => {
    expect(applyCustomRules(base, [rule])).toBeNull();
  });

  it("picks the highest-priority matching rule", () => {
    const low: CustomRule = { ...rule, name: "low", resultingTier: "limited_risk", priority: 1 };
    const high: CustomRule = { ...rule, name: "high", resultingTier: "prohibited", priority: 99 };
    const r = applyCustomRules(
      { ...base, dataProcessed: ["personal"], isPublicFacing: true },
      [low, high],
    );
    expect(r?.internalTier).toBe("prohibited");
  });
});
