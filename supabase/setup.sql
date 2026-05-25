-- =============================================================
-- ActProve — complete Supabase setup
-- Paste this whole file into the Supabase SQL editor and run it.
-- Order: (1) tables  (2) RLS + triggers  (3) storage bucket.
-- Then run the seed (npm run db:seed) or the INSERTs at the bottom.
-- =============================================================

-- ───────────────────────── 1. TABLES & ENUMS ─────────────────────────
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('starter', 'growth', 'team', 'enterprise');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'trial_expired');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('provider', 'deployer', 'both');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "AICategory" AS ENUM ('crm', 'chatbot', 'hr', 'analytics', 'content', 'code', 'other');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('prohibited', 'high_risk', 'limited_risk', 'minimal_risk');

-- CreateEnum
CREATE TYPE "SystemStatus" AS ENUM ('pending', 'compliant', 'needs_action', 'review');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('transparency_notice', 'ai_usage_policy', 'ai_literacy_attestation', 'risk_register', 'fria', 'incident_log', 'vendor_checklist', 'compliance_summary');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'published', 'outdated', 'archived');

-- CreateEnum
CREATE TYPE "GeneratedBy" AS ENUM ('ai', 'manual', 'template');

-- CreateEnum
CREATE TYPE "Regulation" AS ENUM ('eu_ai_act', 'nis2', 'dora', 'iso42001', 'gdpr', 'cra');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('critical', 'high', 'medium', 'info');

-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('draft', 'completed', 'exported');

-- CreateEnum
CREATE TYPE "LiteracyStatus" AS ENUM ('pending', 'completed', 'overdue');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'expired');

-- CreateEnum
CREATE TYPE "FrameworkStatus" AS ENUM ('available', 'active', 'archived');

-- CreateEnum
CREATE TYPE "ObligationStatus" AS ENUM ('todo', 'in_progress', 'in_review', 'complete', 'not_applicable');

-- CreateEnum
CREATE TYPE "ObligationPriority" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('not_connected', 'connected', 'error', 'pending');

-- CreateEnum
CREATE TYPE "AdvisorRole" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'investigating', 'resolved', 'reported');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "country" TEXT NOT NULL,
    "employee_count" INTEGER,
    "industry" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "role" "OrgRole" NOT NULL DEFAULT 'deployer',
    "stripe_customer_id" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'starter',
    "plan_status" "PlanStatus" NOT NULL DEFAULT 'trialing',
    "trial_ends_at" TIMESTAMPTZ,
    "trust_page_slug" TEXT,
    "trust_page_enabled" BOOLEAN NOT NULL DEFAULT false,
    "trust_page_config" JSONB,
    "trust_page_message" TEXT,
    "parent_org_id" UUID,
    "sector" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "document_locale" TEXT NOT NULL DEFAULT 'en',
    "date_format" TEXT NOT NULL DEFAULT 'dd MMM yyyy',
    "brand_color" TEXT,
    "remove_branding" BOOLEAN NOT NULL DEFAULT false,
    "referred_by_code" TEXT,
    "benchmark_opt_in" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "avatar_url" TEXT,
    "job_title" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_systems" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT,
    "category" "AICategory" NOT NULL,
    "description" TEXT,
    "use_case" TEXT,
    "data_processed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "affects_people" BOOLEAN NOT NULL DEFAULT false,
    "affects_employment" BOOLEAN NOT NULL DEFAULT false,
    "affects_credit" BOOLEAN NOT NULL DEFAULT false,
    "affects_healthcare" BOOLEAN NOT NULL DEFAULT false,
    "is_public_facing" BOOLEAN NOT NULL DEFAULT false,
    "has_chatbot_ui" BOOLEAN NOT NULL DEFAULT false,
    "hides_ai_nature" BOOLEAN NOT NULL DEFAULT false,
    "generates_content" BOOLEAN NOT NULL DEFAULT false,
    "is_realtime_biometric" BOOLEAN NOT NULL DEFAULT false,
    "risk_tier" "RiskTier",
    "risk_rationale" TEXT,
    "risk_articles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "risk_confidence" DOUBLE PRECISION,
    "risk_classified_by" "GeneratedBy" NOT NULL DEFAULT 'ai',
    "status" "SystemStatus" NOT NULL DEFAULT 'pending',
    "responsible_person_id" UUID,
    "responsible_person" TEXT,
    "human_oversight" BOOLEAN NOT NULL DEFAULT false,
    "log_retention" BOOLEAN NOT NULL DEFAULT false,
    "log_retention_months" INTEGER,
    "vendor_compliant" BOOLEAN,
    "vendor_compliant_url" TEXT,
    "dpa_in_place" TEXT,
    "data_location" TEXT,
    "deployment_date" DATE,
    "last_reviewed_at" TIMESTAMPTZ,
    "next_review_due" TIMESTAMPTZ,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "discovery_status" TEXT NOT NULL DEFAULT 'confirmed',
    "discovered_via" TEXT,
    "internal_risk_tier" "RiskTier",
    "internal_risk_label" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_documents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "ai_system_id" UUID,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "content_html" TEXT,
    "content_markdown" TEXT,
    "pdf_url" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'draft',
    "generated_by" "GeneratedBy" NOT NULL DEFAULT 'ai',
    "source_hash" TEXT,
    "last_generated_at" TIMESTAMPTZ,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "compliance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content_html" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_updates" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "full_content" TEXT,
    "source_url" TEXT,
    "regulation" "Regulation" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'info',
    "affects_risk_tiers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_regulation_updates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "regulation_update_id" UUID NOT NULL,
    "personalized_text" TEXT,
    "relevant" BOOLEAN NOT NULL DEFAULT true,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "action_taken" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_regulation_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_files" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "ai_system_id" UUID,
    "document_id" UUID,
    "filename" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" BIGINT,
    "mime_type" TEXT,
    "label" TEXT,
    "category" TEXT,
    "obligation" TEXT,
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_responses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "client_name" TEXT,
    "due_date" DATE,
    "raw_questions" JSONB NOT NULL,
    "generated_answers" JSONB,
    "status" "QuestionnaireStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "questionnaire_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "literacy_records" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "job_title" TEXT,
    "systems_used" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "LiteracyStatus" NOT NULL DEFAULT 'pending',
    "token" TEXT NOT NULL,
    "acknowledged_at" TIMESTAMPTZ,
    "acknowledged_ip" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "literacy_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invites" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "invited_by" UUID,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_frameworks" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "description" TEXT,
    "enforcement_date" DATE,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "framework_obligations" (
    "id" UUID NOT NULL,
    "framework_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "applies_to" TEXT,
    "priority" "ObligationPriority" NOT NULL DEFAULT 'medium',
    "estimated_hours" INTEGER,
    "prefill_source" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "framework_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_frameworks" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "framework_id" UUID NOT NULL,
    "status" "FrameworkStatus" NOT NULL DEFAULT 'active',
    "activated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "custom_settings_json" JSONB,
    "cert_body" TEXT,
    "cert_number" TEXT,
    "cert_expiry" DATE,
    "next_audit" DATE,

    CONSTRAINT "org_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_obligations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "obligation_id" UUID NOT NULL,
    "status" "ObligationStatus" NOT NULL DEFAULT 'todo',
    "assignee_id" UUID,
    "evidence_url" TEXT,
    "due_date" DATE,
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "org_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'not_connected',
    "credentials_encrypted" TEXT,
    "config_json" JSONB,
    "last_sync_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_sync_logs" (
    "id" UUID NOT NULL,
    "integration_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,
    "records_synced" INTEGER NOT NULL DEFAULT 0,
    "new_candidates" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'running',
    "errors_json" JSONB,

    CONSTRAINT "integration_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT 'read',
    "last_used_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_logs" (
    "id" UUID NOT NULL,
    "api_key_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "secret_hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_delivered_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "webhook_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_accounts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'referral',
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "referral_code" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "total_referred" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_referrals" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "referred_org_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'signed_up',
    "commission_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_risk_rules" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "condition_json" JSONB NOT NULL,
    "resulting_tier" "RiskTier" NOT NULL,
    "internal_label" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_risk_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_sessions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "auditor_email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,

    CONSTRAINT "audit_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_conversations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "advisor_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "AdvisorRole" NOT NULL,
    "content" TEXT NOT NULL,
    "citations_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_incidents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "ai_system_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'medium',
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "reported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "ai_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_assessments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "assessment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER,
    "findings_json" JSONB,
    "next_review_date" DATE,

    CONSTRAINT "supplier_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_trust_page_slug_key" ON "organizations"("trust_page_slug");

-- CreateIndex
CREATE INDEX "organizations_parent_org_id_idx" ON "organizations"("parent_org_id");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "ai_systems_organization_id_idx" ON "ai_systems"("organization_id");

-- CreateIndex
CREATE INDEX "ai_systems_organization_id_status_idx" ON "ai_systems"("organization_id", "status");

-- CreateIndex
CREATE INDEX "ai_systems_organization_id_risk_tier_idx" ON "ai_systems"("organization_id", "risk_tier");

-- CreateIndex
CREATE INDEX "ai_systems_organization_id_discovery_status_idx" ON "ai_systems"("organization_id", "discovery_status");

-- CreateIndex
CREATE INDEX "compliance_documents_organization_id_idx" ON "compliance_documents"("organization_id");

-- CreateIndex
CREATE INDEX "compliance_documents_organization_id_status_idx" ON "compliance_documents"("organization_id", "status");

-- CreateIndex
CREATE INDEX "compliance_documents_organization_id_type_idx" ON "compliance_documents"("organization_id", "type");

-- CreateIndex
CREATE INDEX "document_versions_document_id_idx" ON "document_versions"("document_id");

-- CreateIndex
CREATE INDEX "regulation_updates_published_at_idx" ON "regulation_updates"("published_at");

-- CreateIndex
CREATE INDEX "org_regulation_updates_organization_id_idx" ON "org_regulation_updates"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_regulation_updates_organization_id_regulation_update_id_key" ON "org_regulation_updates"("organization_id", "regulation_update_id");

-- CreateIndex
CREATE INDEX "evidence_files_organization_id_idx" ON "evidence_files"("organization_id");

-- CreateIndex
CREATE INDEX "questionnaire_responses_organization_id_idx" ON "questionnaire_responses"("organization_id");

-- CreateIndex
CREATE INDEX "audit_log_organization_id_idx" ON "audit_log"("organization_id");

-- CreateIndex
CREATE INDEX "audit_log_organization_id_created_at_idx" ON "audit_log"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_organization_id_idx" ON "notifications"("organization_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE UNIQUE INDEX "literacy_records_user_id_key" ON "literacy_records"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "literacy_records_token_key" ON "literacy_records"("token");

-- CreateIndex
CREATE INDEX "literacy_records_organization_id_idx" ON "literacy_records"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_token_key" ON "team_invites"("token");

-- CreateIndex
CREATE INDEX "team_invites_organization_id_idx" ON "team_invites"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_frameworks_code_key" ON "regulation_frameworks"("code");

-- CreateIndex
CREATE INDEX "framework_obligations_framework_id_idx" ON "framework_obligations"("framework_id");

-- CreateIndex
CREATE UNIQUE INDEX "framework_obligations_framework_id_code_key" ON "framework_obligations"("framework_id", "code");

-- CreateIndex
CREATE INDEX "org_frameworks_organization_id_idx" ON "org_frameworks"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_frameworks_organization_id_framework_id_key" ON "org_frameworks"("organization_id", "framework_id");

-- CreateIndex
CREATE INDEX "org_obligations_organization_id_status_idx" ON "org_obligations"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "org_obligations_organization_id_obligation_id_key" ON "org_obligations"("organization_id", "obligation_id");

-- CreateIndex
CREATE INDEX "integrations_organization_id_idx" ON "integrations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_organization_id_type_key" ON "integrations"("organization_id", "type");

-- CreateIndex
CREATE INDEX "integration_sync_logs_integration_id_idx" ON "integration_sync_logs"("integration_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_organization_id_idx" ON "api_keys"("organization_id");

-- CreateIndex
CREATE INDEX "api_usage_logs_api_key_id_created_at_idx" ON "api_usage_logs"("api_key_id", "created_at");

-- CreateIndex
CREATE INDEX "webhook_endpoints_organization_id_idx" ON "webhook_endpoints"("organization_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhook_id_idx" ON "webhook_deliveries"("webhook_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_accounts_email_key" ON "partner_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "partner_accounts_referral_code_key" ON "partner_accounts"("referral_code");

-- CreateIndex
CREATE INDEX "partner_referrals_partner_id_idx" ON "partner_referrals"("partner_id");

-- CreateIndex
CREATE INDEX "custom_risk_rules_organization_id_idx" ON "custom_risk_rules"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_sessions_token_key" ON "audit_sessions"("token");

-- CreateIndex
CREATE INDEX "audit_sessions_organization_id_idx" ON "audit_sessions"("organization_id");

-- CreateIndex
CREATE INDEX "advisor_conversations_organization_id_idx" ON "advisor_conversations"("organization_id");

-- CreateIndex
CREATE INDEX "advisor_messages_conversation_id_idx" ON "advisor_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "ai_incidents_organization_id_idx" ON "ai_incidents"("organization_id");

-- CreateIndex
CREATE INDEX "supplier_assessments_organization_id_idx" ON "supplier_assessments"("organization_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_org_id_fkey" FOREIGN KEY ("parent_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_responsible_person_id_fkey" FOREIGN KEY ("responsible_person_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_ai_system_id_fkey" FOREIGN KEY ("ai_system_id") REFERENCES "ai_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "compliance_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_regulation_updates" ADD CONSTRAINT "org_regulation_updates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_regulation_updates" ADD CONSTRAINT "org_regulation_updates_regulation_update_id_fkey" FOREIGN KEY ("regulation_update_id") REFERENCES "regulation_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_ai_system_id_fkey" FOREIGN KEY ("ai_system_id") REFERENCES "ai_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "compliance_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "literacy_records" ADD CONSTRAINT "literacy_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "literacy_records" ADD CONSTRAINT "literacy_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "framework_obligations" ADD CONSTRAINT "framework_obligations_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "regulation_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_frameworks" ADD CONSTRAINT "org_frameworks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_frameworks" ADD CONSTRAINT "org_frameworks_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "regulation_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_obligations" ADD CONSTRAINT "org_obligations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_obligations" ADD CONSTRAINT "org_obligations_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "framework_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_sync_logs" ADD CONSTRAINT "integration_sync_logs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partner_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_risk_rules" ADD CONSTRAINT "custom_risk_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_sessions" ADD CONSTRAINT "audit_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_conversations" ADD CONSTRAINT "advisor_conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_messages" ADD CONSTRAINT "advisor_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "advisor_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_incidents" ADD CONSTRAINT "ai_incidents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_incidents" ADD CONSTRAINT "ai_incidents_ai_system_id_fkey" FOREIGN KEY ("ai_system_id") REFERENCES "ai_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_assessments" ADD CONSTRAINT "supplier_assessments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ───────────────────────── 2. RLS, FUNCTIONS & TRIGGERS ─────────────────────────
-- ActProve — Row-Level Security policies & helpers
-- Run this in the Supabase SQL editor AFTER `prisma migrate deploy`.
-- It enforces multi-tenant isolation at the database level (spec §19.2.4).

-- ── Helper: the org of the currently authenticated user ──────────────
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.users where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.users where id = auth.uid();
$$;

-- ── updated_at auto-touch trigger ────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'organizations','users','ai_systems','compliance_documents'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.touch_updated_at();', t, t);
  end loop;
end $$;

-- ── Enable RLS on every table ────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','users','ai_systems','compliance_documents',
    'regulation_updates','org_regulation_updates','evidence_files',
    'questionnaire_responses','audit_log','notifications',
    'literacy_records','team_invites'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ── Tenant-scoped tables: members only see their own org's rows ──────
do $$
declare t text;
begin
  foreach t in array array[
    'ai_systems','compliance_documents','org_regulation_updates',
    'evidence_files','questionnaire_responses','audit_log',
    'notifications','literacy_records','team_invites'
  ] loop
    execute format('drop policy if exists tenant_isolation on public.%I;', t);
    execute format(
      'create policy tenant_isolation on public.%I
       for all to authenticated
       using (organization_id = public.current_org_id())
       with check (organization_id = public.current_org_id());', t);
  end loop;
end $$;

-- organizations: a user can read/update only their own org
drop policy if exists org_self on public.organizations;
create policy org_self on public.organizations
  for all to authenticated
  using (id = public.current_org_id())
  with check (id = public.current_org_id());

-- users: see colleagues in the same org; update only your own row
drop policy if exists users_same_org on public.users;
create policy users_same_org on public.users
  for select to authenticated
  using (organization_id = public.current_org_id());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update to authenticated
  using (id = auth.uid());

-- regulation_updates: global catalogue, readable by all authenticated users
drop policy if exists regs_readable on public.regulation_updates;
create policy regs_readable on public.regulation_updates
  for select to authenticated using (true);

-- NOTE: server-side mutations use the Supabase service-role key (via Prisma),
-- which bypasses RLS. Authorization for those paths is enforced in tRPC
-- middleware (server/trpc.ts). RLS is the defence-in-depth backstop for any
-- direct client (`anon`) access, e.g. realtime subscriptions.

-- ───────────────────────── 3. STORAGE (Evidence Vault) ─────────────────────────
insert into storage.buckets (id, name, public)
  values ('evidence-files', 'evidence-files', false)
  on conflict (id) do nothing;

-- Org members can read/write only their own org's folder (path = <orgId>/...).
drop policy if exists "evidence_read" on storage.objects;
create policy "evidence_read" on storage.objects for select to authenticated
  using (bucket_id = 'evidence-files' and (storage.foldername(name))[1] = public.current_org_id()::text);
drop policy if exists "evidence_write" on storage.objects;
create policy "evidence_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence-files' and (storage.foldername(name))[1] = public.current_org_id()::text);
drop policy if exists "evidence_delete" on storage.objects;
create policy "evidence_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'evidence-files' and (storage.foldername(name))[1] = public.current_org_id()::text);
