import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Developer API",
  description: "ActProve REST API — programmatic access to your EU AI Act compliance data.",
};

const ENDPOINTS: { method: string; path: string; desc: string; plan: string }[] = [
  { method: "GET", path: "/v1/inventory", desc: "List AI systems (pagination, filters)", plan: "Growth+" },
  { method: "GET", path: "/v1/inventory/:id", desc: "Get a single AI system", plan: "Growth+" },
  { method: "GET", path: "/v1/register", desc: "Formal AI register as JSON", plan: "Growth+" },
  { method: "GET", path: "/v1/compliance/score", desc: "Unified compliance score breakdown", plan: "Growth+" },
  { method: "GET", path: "/v1/compliance/obligations", desc: "All obligations with status", plan: "Team+" },
];

export default function DevelopersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold text-brand-navy">ActProve API</h1>
        <p className="mt-3 text-muted-foreground">
          A REST API for integrating your EU AI Act compliance data into GRC
          tools, SIEMs, and CI/CD pipelines. Available on the Team plan and above.
        </p>

        <h2 className="mt-10 text-xl font-bold">Authentication</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a key in{" "}
          <code className="rounded bg-muted px-1">Settings → API</code> and send
          it as a Bearer token:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">
{`curl https://actprove.com/api/v1/inventory \\
  -H "Authorization: Bearer ap_live_xxxxxxxx"`}
        </pre>

        <h2 className="mt-10 text-xl font-bold">Endpoints</h2>
        <div className="mt-3 space-y-2">
          {ENDPOINTS.map((e) => (
            <div
              key={e.path}
              className="flex items-center gap-3 rounded-md border bg-white p-3 text-sm"
            >
              <span className="w-12 shrink-0 font-mono text-xs font-bold text-brand-green">
                {e.method}
              </span>
              <code className="flex-1 text-xs">{e.path}</code>
              <span className="hidden text-muted-foreground sm:block">{e.desc}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                {e.plan}
              </span>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-xl font-bold">Rate limits</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          1,000 requests/hour (Growth), 10,000 requests/hour (Team). Responses
          include a consistent error shape:{" "}
          <code className="rounded bg-muted px-1">{`{ error, code }`}</code>.
        </p>

        <h2 className="mt-10 text-xl font-bold">Webhooks</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Subscribe to events (system.created, system.risk_changed,
          obligation.completed, compliance_score.changed, document.generated,
          regulation.updated). Each delivery is signed with HMAC-SHA256 in the{" "}
          <code className="rounded bg-muted px-1">X-ActProve-Signature</code>{" "}
          header.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
