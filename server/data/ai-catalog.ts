import type { AICategory } from "@prisma/client";

export interface CatalogTool {
  name: string;
  vendor: string;
  category: AICategory;
  /** Display group for the catalog/onboarding grid. */
  group: string;
  defaults?: {
    description?: string;
    dataProcessed?: string[];
    affectsPeople?: boolean;
    affectsEmployment?: boolean;
    affectsCredit?: boolean;
    affectsHealthcare?: boolean;
    isPublicFacing?: boolean;
    hasChatbotUi?: boolean;
    generatesContent?: boolean;
  };
}

/**
 * Pre-configured AI tools with sensible EU AI Act risk indicators. Selecting a
 * tool pre-fills the inventory record so a known system can be added in under
 * 60 seconds (spec §4.2.1). HR/recruitment tools pre-set employment indicators
 * so they classify as high-risk out of the box.
 */
export const AI_CATALOG: CatalogTool[] = [
  // Productivity / Writing
  { name: "ChatGPT", vendor: "OpenAI", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true, hasChatbotUi: true, dataProcessed: ["behavioral"] } },
  { name: "Claude", vendor: "Anthropic", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true, hasChatbotUi: true, dataProcessed: ["behavioral"] } },
  { name: "Gemini", vendor: "Google", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true, hasChatbotUi: true } },
  { name: "Microsoft Copilot", vendor: "Microsoft", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true } },
  { name: "Grammarly AI", vendor: "Grammarly", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true } },
  { name: "Notion AI", vendor: "Notion", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true } },

  // CRM / Sales
  { name: "HubSpot AI", vendor: "HubSpot", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["personal", "behavioral"], affectsPeople: true } },
  { name: "Salesforce Einstein", vendor: "Salesforce", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["personal", "behavioral"], affectsPeople: true } },
  { name: "Pipedrive AI", vendor: "Pipedrive", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["personal"] } },
  { name: "Zoho AI (Zia)", vendor: "Zoho", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["personal"] } },

  // HR / Recruitment — high-risk by default
  { name: "LinkedIn Recruiter", vendor: "LinkedIn", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal"] } },
  { name: "Workday AI", vendor: "Workday", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal"] } },
  { name: "Greenhouse AI", vendor: "Greenhouse", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal"] } },
  { name: "HireVue", vendor: "HireVue", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal", "biometric"] } },

  // Customer Support — limited-risk chatbots
  { name: "Intercom AI (Fin)", vendor: "Intercom", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, isPublicFacing: true, dataProcessed: ["personal"] } },
  { name: "Zendesk AI", vendor: "Zendesk", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, isPublicFacing: true, dataProcessed: ["personal"] } },
  { name: "Freshdesk AI (Freddy)", vendor: "Freshworks", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, isPublicFacing: true } },
  { name: "Drift", vendor: "Drift", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, isPublicFacing: true } },

  // Analytics / Data
  { name: "Tableau AI (Pulse)", vendor: "Salesforce", category: "analytics", group: "Analytics / Data", defaults: { dataProcessed: ["behavioral"] } },
  { name: "Power BI Copilot", vendor: "Microsoft", category: "analytics", group: "Analytics / Data", defaults: { dataProcessed: ["behavioral"] } },
  { name: "Google Analytics 4", vendor: "Google", category: "analytics", group: "Analytics / Data", defaults: { dataProcessed: ["behavioral", "location"] } },
  { name: "Mixpanel", vendor: "Mixpanel", category: "analytics", group: "Analytics / Data", defaults: { dataProcessed: ["behavioral"] } },

  // Marketing — content generation
  { name: "Jasper", vendor: "Jasper", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "Copy.ai", vendor: "Copy.ai", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "Midjourney", vendor: "Midjourney", category: "content", group: "Marketing", defaults: { generatesContent: true, isPublicFacing: true } },
  { name: "DALL-E", vendor: "OpenAI", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "Adobe Firefly", vendor: "Adobe", category: "content", group: "Marketing", defaults: { generatesContent: true } },

  // Code / Dev
  { name: "GitHub Copilot", vendor: "GitHub", category: "code", group: "Code / Dev", defaults: { generatesContent: true } },
  { name: "Cursor", vendor: "Anysphere", category: "code", group: "Code / Dev", defaults: { generatesContent: true } },
  { name: "Tabnine", vendor: "Tabnine", category: "code", group: "Code / Dev", defaults: { generatesContent: true } },
  { name: "Replit AI (Ghostwriter)", vendor: "Replit", category: "code", group: "Code / Dev", defaults: { generatesContent: true } },

  // Finance
  { name: "QuickBooks AI", vendor: "Intuit", category: "analytics", group: "Finance", defaults: { dataProcessed: ["financial"] } },
  { name: "Xero AI", vendor: "Xero", category: "analytics", group: "Finance", defaults: { dataProcessed: ["financial"] } },
  { name: "Stripe Radar", vendor: "Stripe", category: "analytics", group: "Finance", defaults: { dataProcessed: ["financial", "behavioral"], affectsPeople: true } },

  // ── Expanded catalog ──
  // Productivity / Writing
  { name: "Microsoft 365 Copilot", vendor: "Microsoft", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true } },
  { name: "Google Gemini for Workspace", vendor: "Google", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true } },
  { name: "Perplexity AI", vendor: "Perplexity", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true, hasChatbotUi: true } },
  { name: "Otter.ai", vendor: "Otter", category: "content", group: "Productivity / Writing", defaults: { dataProcessed: ["personal"], generatesContent: true } },
  { name: "Fireflies.ai", vendor: "Fireflies", category: "content", group: "Productivity / Writing", defaults: { dataProcessed: ["personal"] } },
  { name: "DeepL", vendor: "DeepL", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true } },
  { name: "Mem AI", vendor: "Mem", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true } },
  { name: "Coda AI", vendor: "Coda", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true } },
  { name: "ClickUp AI", vendor: "ClickUp", category: "content", group: "Productivity / Writing", defaults: { generatesContent: true } },
  { name: "Slack AI", vendor: "Slack", category: "content", group: "Productivity / Writing", defaults: { dataProcessed: ["personal"] } },
  { name: "Reclaim.ai", vendor: "Reclaim", category: "other", group: "Productivity / Writing", defaults: { dataProcessed: ["personal"] } },
  { name: "Superhuman AI", vendor: "Superhuman", category: "content", group: "Productivity / Writing", defaults: { dataProcessed: ["personal"], generatesContent: true } },

  // CRM / Sales
  { name: "Apollo.io AI", vendor: "Apollo", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["personal", "behavioral"] } },
  { name: "Gong", vendor: "Gong", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["personal", "behavioral"], affectsPeople: true } },
  { name: "Outreach AI", vendor: "Outreach", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["personal"] } },
  { name: "Clari", vendor: "Clari", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["behavioral"] } },
  { name: "6sense", vendor: "6sense", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["behavioral"] } },
  { name: "Clay", vendor: "Clay", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["personal"] } },
  { name: "Lavender", vendor: "Lavender", category: "crm", group: "CRM / Sales", defaults: { generatesContent: true } },
  { name: "Chorus.ai", vendor: "ZoomInfo", category: "crm", group: "CRM / Sales", defaults: { dataProcessed: ["personal"], affectsPeople: true } },

  // HR / Recruitment (high-risk indicators pre-set)
  { name: "Eightfold AI", vendor: "Eightfold", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal"] } },
  { name: "SeekOut", vendor: "SeekOut", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal"] } },
  { name: "Pymetrics", vendor: "Pymetrics", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal", "behavioral"] } },
  { name: "iCIMS AI", vendor: "iCIMS", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal"] } },
  { name: "Lever AI", vendor: "Lever", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal"] } },
  { name: "BambooHR AI", vendor: "BambooHR", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, dataProcessed: ["personal"] } },
  { name: "Paradox (Olivia)", vendor: "Paradox", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, hasChatbotUi: true, dataProcessed: ["personal"] } },
  { name: "Beamery", vendor: "Beamery", category: "hr", group: "HR / Recruitment", defaults: { affectsEmployment: true, affectsPeople: true, dataProcessed: ["personal"] } },

  // Customer Support
  { name: "Ada", vendor: "Ada", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, isPublicFacing: true, dataProcessed: ["personal"] } },
  { name: "Forethought", vendor: "Forethought", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, isPublicFacing: true } },
  { name: "Tidio", vendor: "Tidio", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, isPublicFacing: true } },
  { name: "Crisp AI", vendor: "Crisp", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, isPublicFacing: true } },
  { name: "Help Scout AI", vendor: "Help Scout", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, dataProcessed: ["personal"] } },
  { name: "Kustomer IQ", vendor: "Kustomer", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, dataProcessed: ["personal"] } },
  { name: "Gorgias AI", vendor: "Gorgias", category: "chatbot", group: "Customer Support", defaults: { hasChatbotUi: true, isPublicFacing: true } },

  // Analytics / Data
  { name: "Amplitude AI", vendor: "Amplitude", category: "analytics", group: "Analytics / Data", defaults: { dataProcessed: ["behavioral"] } },
  { name: "Pecan AI", vendor: "Pecan", category: "analytics", group: "Analytics / Data", defaults: { dataProcessed: ["behavioral"] } },
  { name: "ThoughtSpot", vendor: "ThoughtSpot", category: "analytics", group: "Analytics / Data", defaults: { dataProcessed: ["behavioral"] } },
  { name: "Sisense AI", vendor: "Sisense", category: "analytics", group: "Analytics / Data", defaults: { dataProcessed: ["behavioral"] } },
  { name: "Databricks Mosaic AI", vendor: "Databricks", category: "analytics", group: "Analytics / Data", defaults: {} },
  { name: "Snowflake Cortex", vendor: "Snowflake", category: "analytics", group: "Analytics / Data", defaults: {} },
  { name: "Hex Magic", vendor: "Hex", category: "analytics", group: "Analytics / Data", defaults: {} },
  { name: "MonkeyLearn", vendor: "MonkeyLearn", category: "analytics", group: "Analytics / Data", defaults: { dataProcessed: ["behavioral"] } },

  // Marketing
  { name: "Writesonic", vendor: "Writesonic", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "Surfer SEO", vendor: "Surfer", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "Synthesia", vendor: "Synthesia", category: "content", group: "Marketing", defaults: { generatesContent: true, isPublicFacing: true } },
  { name: "ElevenLabs", vendor: "ElevenLabs", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "Runway", vendor: "Runway", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "Stable Diffusion", vendor: "Stability AI", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "Canva Magic Studio", vendor: "Canva", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "HeyGen", vendor: "HeyGen", category: "content", group: "Marketing", defaults: { generatesContent: true, isPublicFacing: true } },
  { name: "Descript", vendor: "Descript", category: "content", group: "Marketing", defaults: { generatesContent: true } },
  { name: "AdCreative.ai", vendor: "AdCreative", category: "content", group: "Marketing", defaults: { generatesContent: true } },

  // Code / Dev
  { name: "Amazon CodeWhisperer", vendor: "Amazon", category: "code", group: "Code / Dev", defaults: { generatesContent: true } },
  { name: "Codeium", vendor: "Codeium", category: "code", group: "Code / Dev", defaults: { generatesContent: true } },
  { name: "Sourcegraph Cody", vendor: "Sourcegraph", category: "code", group: "Code / Dev", defaults: { generatesContent: true } },
  { name: "Sentry Seer", vendor: "Sentry", category: "code", group: "Code / Dev", defaults: {} },
  { name: "Snyk DeepCode AI", vendor: "Snyk", category: "code", group: "Code / Dev", defaults: {} },
  { name: "Devin", vendor: "Cognition", category: "code", group: "Code / Dev", defaults: { generatesContent: true } },
  { name: "Windsurf", vendor: "Codeium", category: "code", group: "Code / Dev", defaults: { generatesContent: true } },

  // Finance
  { name: "Ramp Intelligence", vendor: "Ramp", category: "analytics", group: "Finance", defaults: { dataProcessed: ["financial"] } },
  { name: "Brex AI", vendor: "Brex", category: "analytics", group: "Finance", defaults: { dataProcessed: ["financial"] } },
  { name: "Sardine", vendor: "Sardine", category: "analytics", group: "Finance", defaults: { dataProcessed: ["financial", "behavioral"], affectsCredit: true, affectsPeople: true } },
  { name: "Zest AI", vendor: "Zest AI", category: "analytics", group: "Finance", defaults: { dataProcessed: ["financial"], affectsCredit: true, affectsPeople: true } },
  { name: "Upstart", vendor: "Upstart", category: "analytics", group: "Finance", defaults: { dataProcessed: ["financial"], affectsCredit: true, affectsPeople: true } },

  // Healthcare
  { name: "Nuance DAX (Dragon)", vendor: "Microsoft/Nuance", category: "other", group: "Healthcare", defaults: { affectsHealthcare: true, affectsPeople: true, dataProcessed: ["health", "personal"] } },
  { name: "Aidoc", vendor: "Aidoc", category: "other", group: "Healthcare", defaults: { affectsHealthcare: true, affectsPeople: true, dataProcessed: ["health"] } },
  { name: "Viz.ai", vendor: "Viz.ai", category: "other", group: "Healthcare", defaults: { affectsHealthcare: true, affectsPeople: true, dataProcessed: ["health"] } },
  { name: "PathAI", vendor: "PathAI", category: "other", group: "Healthcare", defaults: { affectsHealthcare: true, affectsPeople: true, dataProcessed: ["health"] } },
  { name: "Tempus", vendor: "Tempus", category: "analytics", group: "Healthcare", defaults: { affectsHealthcare: true, affectsPeople: true, dataProcessed: ["health"] } },

  // Security / IT
  { name: "Microsoft Security Copilot", vendor: "Microsoft", category: "other", group: "Security / IT", defaults: {} },
  { name: "CrowdStrike Charlotte AI", vendor: "CrowdStrike", category: "other", group: "Security / IT", defaults: {} },
  { name: "Darktrace", vendor: "Darktrace", category: "other", group: "Security / IT", defaults: { dataProcessed: ["behavioral"] } },
  { name: "Abnormal Security", vendor: "Abnormal", category: "other", group: "Security / IT", defaults: { dataProcessed: ["personal"] } },
  { name: "Datadog Bits AI", vendor: "Datadog", category: "other", group: "Security / IT", defaults: {} },
  { name: "PagerDuty AIOps", vendor: "PagerDuty", category: "other", group: "Security / IT", defaults: {} },

  // Legal / Professional
  { name: "Harvey AI", vendor: "Harvey", category: "content", group: "Legal / Professional", defaults: { generatesContent: true, dataProcessed: ["personal"] } },
  { name: "Spellbook", vendor: "Spellbook", category: "content", group: "Legal / Professional", defaults: { generatesContent: true } },
  { name: "Robin AI", vendor: "Robin AI", category: "content", group: "Legal / Professional", defaults: { generatesContent: true } },
  { name: "Luminance", vendor: "Luminance", category: "content", group: "Legal / Professional", defaults: { generatesContent: true } },
  { name: "Thomson Reuters CoCounsel", vendor: "Thomson Reuters", category: "content", group: "Legal / Professional", defaults: { generatesContent: true } },
];

export const CATALOG_GROUPS = Array.from(
  new Set(AI_CATALOG.map((t) => t.group)),
);

export function findCatalogTool(name: string): CatalogTool | undefined {
  return AI_CATALOG.find((t) => t.name.toLowerCase() === name.toLowerCase());
}
