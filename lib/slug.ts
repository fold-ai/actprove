/** Slugify a string to a URL-safe identifier. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Short random suffix to disambiguate slug clashes. */
export function randomSuffix(len = 4): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + len);
}
