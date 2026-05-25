import { prisma } from "@/lib/prisma";

export interface FrameworkScore {
  code: string;
  name: string;
  score: number;
  detail: string;
  primary: boolean;
}

export interface UnifiedScore {
  aggregate: number;
  frameworks: FrameworkScore[];
}

/**
 * Computes the unified compliance score (spec §3.5): EU AI Act (primary,
 * derived from the inventory) plus each activated framework (obligations
 * complete / total). The aggregate is a weighted average — primary counts
 * double.
 */
export async function getUnifiedScore(orgId: string): Promise<UnifiedScore> {
  const [total, compliant, orgFrameworks] = await Promise.all([
    prisma.aiSystem.count({ where: { organizationId: orgId, archived: false } }),
    prisma.aiSystem.count({
      where: { organizationId: orgId, archived: false, status: "compliant" },
    }),
    prisma.orgFramework.findMany({
      where: { organizationId: orgId, status: "active" },
      include: { framework: true },
    }),
  ]);

  const euScore = total === 0 ? 0 : Math.round((compliant / total) * 100);
  const frameworks: FrameworkScore[] = [
    {
      code: "eu_ai_act",
      name: "EU AI Act",
      score: euScore,
      detail: `${compliant}/${total} systems compliant`,
      primary: true,
    },
  ];

  for (const of of orgFrameworks) {
    const obligations = await prisma.orgObligation.findMany({
      where: { organizationId: orgId, obligation: { frameworkId: of.frameworkId } },
      select: { status: true },
    });
    const done = obligations.filter(
      (o) => o.status === "complete" || o.status === "not_applicable",
    ).length;
    const score =
      obligations.length === 0 ? 0 : Math.round((done / obligations.length) * 100);
    frameworks.push({
      code: of.framework.code,
      name: of.framework.name,
      score,
      detail: `${done}/${obligations.length} obligations met`,
      primary: false,
    });
  }

  // Weighted average — primary framework counts double.
  const weightSum = frameworks.reduce((s, f) => s + (f.primary ? 2 : 1), 0);
  const weighted = frameworks.reduce(
    (s, f) => s + f.score * (f.primary ? 2 : 1),
    0,
  );
  const aggregate = weightSum === 0 ? 0 : Math.round(weighted / weightSum);

  return { aggregate, frameworks };
}
