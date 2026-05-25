import { createTRPCRouter } from "@/server/trpc";
import { orgRouter } from "@/server/routers/org";
import { aiSystemsRouter } from "@/server/routers/ai-systems";
import { documentsRouter } from "@/server/routers/documents";
import { trustRouter } from "@/server/routers/trust";
import { regulationsRouter } from "@/server/routers/regulations";
import { teamRouter } from "@/server/routers/team";
import { questionnairesRouter } from "@/server/routers/questionnaires";
import { literacyRouter } from "@/server/routers/literacy";
import { evidenceRouter } from "@/server/routers/evidence";
import { frameworksRouter } from "@/server/routers/frameworks";
import { enterpriseRouter } from "@/server/routers/enterprise";
import { advisorRouter } from "@/server/routers/advisor";
import { apiRouter } from "@/server/routers/api-keys";
import { integrationsRouter } from "@/server/routers/integrations";
import { partnerRouter } from "@/server/routers/partner";
import { toolsRouter } from "@/server/routers/tools";
import { insightsRouter } from "@/server/routers/insights";
import { searchRouter } from "@/server/routers/search";
import { notificationsRouter } from "@/server/routers/notifications";

export const appRouter = createTRPCRouter({
  org: orgRouter,
  aiSystems: aiSystemsRouter,
  documents: documentsRouter,
  trust: trustRouter,
  regulations: regulationsRouter,
  team: teamRouter,
  questionnaires: questionnairesRouter,
  literacy: literacyRouter,
  evidence: evidenceRouter,
  frameworks: frameworksRouter,
  enterprise: enterpriseRouter,
  advisor: advisorRouter,
  api: apiRouter,
  integrations: integrationsRouter,
  partner: partnerRouter,
  tools: toolsRouter,
  insights: insightsRouter,
  search: searchRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
