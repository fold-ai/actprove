import type { RiskTier, SystemStatus, DocumentStatus } from "@prisma/client";

export const RISK_META: Record<
  RiskTier,
  { label: string; className: string; dot: string }
> = {
  minimal_risk: {
    label: "Minimal Risk",
    className: "bg-risk-minimal-bg text-risk-minimal border-risk-minimal/30",
    dot: "bg-risk-minimal",
  },
  limited_risk: {
    label: "Limited Risk",
    className: "bg-risk-limited-bg text-risk-limited border-risk-limited/40",
    dot: "bg-risk-limited",
  },
  high_risk: {
    label: "High Risk",
    className: "bg-risk-high-bg text-risk-high border-risk-high/40",
    dot: "bg-risk-high",
  },
  prohibited: {
    label: "Prohibited",
    className:
      "bg-risk-prohibited-bg text-risk-prohibited border-risk-prohibited/40",
    dot: "bg-risk-prohibited",
  },
};

export const PENDING_META = {
  label: "Pending",
  className: "bg-risk-pending-bg text-risk-pending border-risk-pending/40",
  dot: "bg-risk-pending",
};

export const STATUS_META: Record<
  SystemStatus,
  { label: string; className: string }
> = {
  compliant: { label: "Compliant", className: "bg-risk-minimal-bg text-risk-minimal" },
  needs_action: { label: "Needs Action", className: "bg-risk-high-bg text-risk-high" },
  review: { label: "In Review", className: "bg-risk-limited-bg text-risk-limited" },
  pending: { label: "Pending", className: "bg-risk-pending-bg text-risk-pending" },
};

export const DOC_STATUS_META: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  published: { label: "Published", className: "bg-risk-minimal-bg text-risk-minimal" },
  outdated: { label: "Outdated", className: "bg-risk-limited-bg text-risk-limited" },
  archived: { label: "Archived", className: "bg-gray-200 text-gray-500" },
};

export const CATEGORY_LABEL: Record<string, string> = {
  crm: "CRM",
  chatbot: "Chatbot",
  hr: "HR",
  analytics: "Analytics",
  content: "Content",
  code: "Code",
  other: "Other",
};

export function healthColor(score: number): string {
  if (score >= 70) return "text-risk-minimal";
  if (score >= 40) return "text-risk-limited";
  return "text-risk-prohibited";
}
