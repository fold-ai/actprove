import { PrismaClient } from "@prisma/client";
import { REGULATION_SEED } from "../server/data/regulation-seed";
import { FRAMEWORK_SEED } from "../server/data/frameworks-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding regulation updates…");
  for (const r of REGULATION_SEED) {
    // Idempotent on (title) — skip if already present.
    const existing = await prisma.regulationUpdate.findFirst({
      where: { title: r.title },
    });
    if (existing) continue;
    await prisma.regulationUpdate.create({
      data: {
        title: r.title,
        summary: r.summary,
        fullContent: r.fullContent,
        sourceUrl: r.sourceUrl,
        regulation: r.regulation,
        severity: r.severity,
        affectsRiskTiers: r.affectsRiskTiers,
        publishedAt: new Date(r.publishedAt),
      },
    });
  }
  console.log(`Seeded ${REGULATION_SEED.length} regulation updates.`);

  console.log("Seeding regulation frameworks…");
  for (const f of FRAMEWORK_SEED) {
    const framework = await prisma.regulationFramework.upsert({
      where: { code: f.code },
      create: {
        code: f.code,
        name: f.name,
        jurisdiction: f.jurisdiction,
        description: f.description,
        enforcementDate: f.enforcementDate ? new Date(f.enforcementDate) : null,
        recurring: f.recurring ?? false,
      },
      update: { name: f.name, description: f.description },
    });
    for (let i = 0; i < f.obligations.length; i++) {
      const o = f.obligations[i];
      await prisma.frameworkObligation.upsert({
        where: { frameworkId_code: { frameworkId: framework.id, code: o.code } },
        create: {
          frameworkId: framework.id,
          code: o.code,
          title: o.title,
          description: o.description,
          appliesTo: o.appliesTo,
          priority: o.priority ?? "medium",
          estimatedHours: o.estimatedHours,
          prefillSource: o.prefillSource,
          sortOrder: i,
        },
        update: { title: o.title, description: o.description, sortOrder: i },
      });
    }
  }
  console.log(`Seeded ${FRAMEWORK_SEED.length} frameworks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
