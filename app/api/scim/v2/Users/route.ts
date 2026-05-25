import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { scimAuth } from "@/lib/scim";

export const dynamic = "force-dynamic";

function toScim(u: { id: string; email: string; fullName: string | null }) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: u.id,
    userName: u.email,
    name: { formatted: u.fullName ?? u.email },
    emails: [{ value: u.email, primary: true }],
    active: true,
  };
}

export async function GET(req: NextRequest) {
  const auth = scimAuth(req);
  if (auth instanceof NextResponse) return auth;
  const users = await prisma.user.findMany({
    where: { organizationId: auth.orgId },
    select: { id: true, email: true, fullName: true },
  });
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: users.length,
    Resources: users.map(toScim),
  });
}

export async function POST(req: NextRequest) {
  const auth = scimAuth(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json()) as {
    userName?: string;
    emails?: { value: string }[];
    name?: { formatted?: string };
  };
  const email = body.userName ?? body.emails?.[0]?.value;
  if (!email) {
    return NextResponse.json({ status: "400", detail: "userName required" }, { status: 400 });
  }
  // Provisioned users are linked to a Supabase auth identity on first login.
  const user = await prisma.user.upsert({
    where: { id: crypto.randomUUID() }, // never matches → effectively create
    create: {
      id: crypto.randomUUID(),
      email,
      fullName: body.name?.formatted ?? null,
      organizationId: auth.orgId,
      role: "member",
    },
    update: {},
  });
  return NextResponse.json(toScim(user), { status: 201 });
}
