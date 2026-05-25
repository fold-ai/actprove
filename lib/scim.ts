import { type NextRequest, NextResponse } from "next/server";

/**
 * SCIM 2.0 auth (spec §10.6). Validates the bearer token and resolves the org
 * from the X-ActProve-Org header. Returns the orgId or an error response.
 * NOTE: requires an IdP (Okta/Azure AD) to exercise end-to-end.
 */
export function scimAuth(req: NextRequest): { orgId: string } | NextResponse {
  const token = process.env.SCIM_TOKEN;
  const auth = req.headers.get("authorization");
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "401" },
      { status: 401 },
    );
  }
  const orgId = req.headers.get("x-actprove-org");
  if (!orgId) {
    return NextResponse.json(
      {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
        detail: "Missing X-ActProve-Org header",
        status: "400",
      },
      { status: 400 },
    );
  }
  return { orgId };
}
