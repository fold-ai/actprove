// Integration marketplace catalog (spec §4.2). OAuth flows for cloud providers
// require provider credentials; until configured, "connect" registers the
// integration and a sync performs catalog-based discovery so the shadow-IT flow
// is demonstrable. The CSV connector is fully functional offline.

export interface IntegrationDef {
  type: string;
  name: string;
  description: string;
  authMethod: "oauth2" | "api_key" | "csv";
  tier: 1 | 2;
  /** Catalog tool names this integration typically discovers (for sync). */
  discovers: string[];
}

export const INTEGRATION_CATALOG: IntegrationDef[] = [
  {
    type: "azure",
    name: "Microsoft Azure",
    description: "Discovers Azure OpenAI, Cognitive Services, ML Studio and Bot Services.",
    authMethod: "oauth2",
    tier: 1,
    discovers: ["Microsoft Copilot", "ChatGPT"],
  },
  {
    type: "m365",
    name: "Microsoft 365 / Copilot",
    description: "Detects M365 Copilot and AI features across Teams, Word and Excel.",
    authMethod: "oauth2",
    tier: 1,
    discovers: ["Microsoft Copilot"],
  },
  {
    type: "github",
    name: "GitHub",
    description: "Discovers GitHub Copilot usage and AI-powered Actions.",
    authMethod: "oauth2",
    tier: 1,
    discovers: ["GitHub Copilot", "Cursor"],
  },
  {
    type: "gcp",
    name: "Google Cloud",
    description: "Discovers Vertex AI, DialogFlow, Vision AI and Natural Language API.",
    authMethod: "oauth2",
    tier: 1,
    discovers: ["Gemini"],
  },
  {
    type: "aws",
    name: "AWS",
    description: "Discovers Amazon Bedrock, SageMaker, Rekognition and Lex.",
    authMethod: "api_key",
    tier: 1,
    discovers: ["ChatGPT"],
  },
  {
    type: "okta",
    name: "Okta / Azure AD",
    description: "Reads authorized SaaS apps to surface shadow AI across the company.",
    authMethod: "oauth2",
    tier: 1,
    discovers: ["Grammarly AI", "Notion AI", "Jasper", "Midjourney"],
  },
  {
    type: "hubspot",
    name: "HubSpot",
    description: "Detects HubSpot AI: email assistant, content AI, conversation intelligence.",
    authMethod: "oauth2",
    tier: 2,
    discovers: ["HubSpot AI"],
  },
  {
    type: "salesforce",
    name: "Salesforce",
    description: "Detects Einstein AI features and Einstein GPT.",
    authMethod: "oauth2",
    tier: 2,
    discovers: ["Salesforce Einstein"],
  },
  {
    type: "slack",
    name: "Slack",
    description: "Monitors Slack AI features and the installed app directory.",
    authMethod: "oauth2",
    tier: 2,
    discovers: ["Intercom AI (Fin)"],
  },
  {
    type: "jira",
    name: "Jira / Confluence",
    description: "Syncs compliance obligations to Jira issues and discovers AI projects.",
    authMethod: "oauth2",
    tier: 2,
    discovers: [],
  },
  {
    type: "csv",
    name: "CSV / Expense import",
    description: "Paste vendor names or a card statement — we match known AI vendors.",
    authMethod: "csv",
    tier: 1,
    discovers: [],
  },
];

export function findIntegrationDef(type: string) {
  return INTEGRATION_CATALOG.find((i) => i.type === type);
}
