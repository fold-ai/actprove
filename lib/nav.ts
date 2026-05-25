import {
  LayoutDashboard,
  Database,
  ListChecks,
  FileText,
  Shield,
  Bell,
  ClipboardList,
  GraduationCap,
  Lock,
  Settings,
  Layers,
  KanbanSquare,
  MessageSquare,
  Calendar,
  Plug,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "AI Advisor", href: "/dashboard/advisor", icon: MessageSquare, group: "Overview" },

  { label: "AI Inventory", href: "/dashboard/inventory", icon: Database, group: "Compliance" },
  { label: "Register", href: "/dashboard/register", icon: ListChecks, group: "Compliance" },
  { label: "Frameworks", href: "/dashboard/frameworks", icon: Layers, group: "Compliance" },
  { label: "Obligations", href: "/dashboard/obligations", icon: KanbanSquare, group: "Compliance" },
  { label: "Documents", href: "/dashboard/documents", icon: FileText, group: "Compliance" },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar, group: "Compliance" },

  { label: "Regulations", href: "/dashboard/regulations", icon: Bell, group: "Operate" },
  { label: "Questionnaires", href: "/dashboard/questionnaires", icon: ClipboardList, group: "Operate" },
  { label: "AI Literacy", href: "/dashboard/literacy", icon: GraduationCap, group: "Operate" },
  { label: "Evidence Vault", href: "/dashboard/vault", icon: Lock, group: "Operate" },
  { label: "Integrations", href: "/dashboard/integrations", icon: Plug, group: "Operate" },

  { label: "Trust Page", href: "/dashboard/trust-page", icon: Shield, group: "Settings" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Settings" },
];
