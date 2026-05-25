/**
 * Best-effort vendor logo from a guessed domain via Google's favicon service.
 * Returns null for unknown vendors so the UI can fall back to initials.
 */
const DOMAINS: Record<string, string> = {
  openai: "openai.com",
  anthropic: "anthropic.com",
  google: "google.com",
  microsoft: "microsoft.com",
  github: "github.com",
  hubspot: "hubspot.com",
  salesforce: "salesforce.com",
  notion: "notion.so",
  intercom: "intercom.com",
  zendesk: "zendesk.com",
  stripe: "stripe.com",
  adobe: "adobe.com",
  linkedin: "linkedin.com",
  workday: "workday.com",
  slack: "slack.com",
  grammarly: "grammarly.com",
};

export function vendorLogo(vendor: string | null | undefined): string | null {
  if (!vendor) return null;
  const key = vendor.toLowerCase().split(/[\s/(]/)[0];
  const domain = DOMAINS[key] ?? `${key.replace(/[^a-z0-9]/g, "")}.com`;
  if (!domain || domain === ".com") return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}
