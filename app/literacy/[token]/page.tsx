import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { AckForm } from "./ack-form";

export const dynamic = "force-dynamic";

export default async function LiteracyAckPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await prisma.literacyRecord.findUnique({
    where: { token },
    include: { organization: true },
  });
  if (!record) notFound();

  const systems = await prisma.aiSystem.findMany({
    where: { organizationId: record.organizationId, archived: false },
    select: { name: true, riskTier: true },
    take: 12,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardContent className="space-y-6 p-8">
            <div>
              <h1 className="text-2xl font-bold">AI literacy acknowledgment</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                For {record.organization.name} · EU AI Act Article 4
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <p>
                The EU AI Act requires everyone who uses or manages AI tools to
                understand how they work, their limitations, and their
                responsibilities. Please review the points below.
              </p>
              <div className="rounded-md bg-secondary p-4">
                <div className="mb-2 font-medium">Your responsibilities</div>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>Use AI tools only for approved business purposes.</li>
                  <li>Always review AI-generated output before relying on it.</li>
                  <li>
                    Never input confidential or personal data into unapproved
                    tools.
                  </li>
                  <li>Keep a human in the loop for decisions affecting people.</li>
                </ul>
              </div>
              {systems.length > 0 && (
                <div className="rounded-md border p-4">
                  <div className="mb-2 font-medium">
                    AI tools used at {record.organization.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {systems.map((s) => (
                      <span
                        key={s.name}
                        className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <AckForm token={token} defaultName={record.name} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
