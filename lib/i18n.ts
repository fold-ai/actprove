import "server-only";

export const LOCALES = ["en", "de", "pl", "nl", "fr", "es", "it"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Loads the message catalogue for a locale (spec §8). Used to feed
 * NextIntlClientProvider in the dashboard; falls back to English.
 */
export async function getMessages(locale: string) {
  const safe = (LOCALES as readonly string[]).includes(locale) ? locale : "en";
  try {
    return (await import(`@/messages/${safe}.json`)).default;
  } catch {
    return (await import(`@/messages/en.json`)).default;
  }
}
