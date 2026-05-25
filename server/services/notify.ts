import { prisma } from "@/lib/prisma";

/** Creates an in-app notification (spec §17.3). Never throws into the caller. */
export async function notify(input: {
  organizationId: string;
  userId?: string | null;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
      },
    });
  } catch (err) {
    console.error("[notify] failed", input.type, err);
  }
}
