import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Minimal OpenAPI 3.1 description of the public API (spec §4.5). */
export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://actprove.com";
  const spec = {
    openapi: "3.1.0",
    info: { title: "ActProve API", version: "1.0.0", description: "EU AI Act compliance data API." },
    servers: [{ url: `${base}/api/v1` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "ap_live_*" },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/inventory": {
        get: { summary: "List AI systems", responses: { "200": { description: "OK" } } },
        post: { summary: "Create an AI system (read_write)", responses: { "201": { description: "Created" } } },
      },
      "/inventory/{id}": {
        get: { summary: "Get an AI system", responses: { "200": { description: "OK" } } },
        put: { summary: "Update an AI system (read_write)", responses: { "200": { description: "OK" } } },
      },
      "/register": { get: { summary: "AI register as JSON", responses: { "200": { description: "OK" } } } },
      "/register.pdf": { get: { summary: "AI register as PDF", responses: { "200": { description: "OK" } } } },
      "/compliance/score": { get: { summary: "Unified compliance score", responses: { "200": { description: "OK" } } } },
      "/compliance/obligations": { get: { summary: "List obligations", responses: { "200": { description: "OK" } } } },
      "/trust-page": { get: { summary: "Trust page data", responses: { "200": { description: "OK" } } } },
      "/webhooks": {
        get: { summary: "List webhooks", responses: { "200": { description: "OK" } } },
        post: { summary: "Register a webhook (read_write)", responses: { "201": { description: "Created" } } },
      },
      "/webhooks/{id}": {
        delete: { summary: "Delete a webhook (read_write)", responses: { "200": { description: "OK" } } },
      },
    },
  };
  return NextResponse.json(spec);
}
