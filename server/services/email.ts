import "server-only";
import { Resend } from "resend";

let _resend: Resend | null = null;
function client() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "ActProve <notifications@actprove.com>";

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/**
 * Loops.so lifecycle-marketing hook (spec §2.2). Sends a contact event when
 * LOOPS_API_KEY is set, otherwise no-ops — keeps transactional (Resend) and
 * lifecycle (Loops) email cleanly separated.
 */
export async function loopsEvent(
  email: string,
  eventName: string,
  properties: Record<string, string | number> = {},
) {
  const key = process.env.LOOPS_API_KEY;
  if (!key) return { skipped: true };
  try {
    await fetch("https://app.loops.so/api/v1/events/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ email, eventName, ...properties }),
    });
  } catch (err) {
    console.error("[loops] event failed", eventName, err);
  }
  return { ok: true };
}

/**
 * Sends a transactional email via Resend. No-ops (logs) when unconfigured so
 * the rest of the app keeps working in development.
 */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
}) {
  const resend = client();
  if (!resend) {
    console.log(`[email] (skipped — RESEND_API_KEY unset) → ${opts.subject}`);
    return { skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      react: opts.react,
      html: opts.html,
    } as Parameters<typeof resend.emails.send>[0]);
    if (error) console.error("[email] send error", error);
    return { id: data?.id };
  } catch (err) {
    console.error("[email] send failed", err);
    return { error: true };
  }
}
