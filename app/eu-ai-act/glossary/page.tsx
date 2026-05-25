import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { glossaryGroups, GLOSSARY } from "@/lib/seo/glossary";

export const metadata: Metadata = {
  title: "EU AI Act Glossary",
  description:
    "Plain-English definitions of EU AI Act terms — provider, deployer, high-risk, Annex III, transparency notice and more.",
};

export default function GlossaryPage() {
  const groups = glossaryGroups();
  const letters = Object.keys(groups).sort();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-bold text-brand-navy">EU AI Act glossary</h1>
        <p className="mt-3 text-muted-foreground">
          {GLOSSARY.length} key terms, in plain English.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {letters.map((l) => (
            <a
              key={l}
              href={`#letter-${l}`}
              className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50"
            >
              {l}
            </a>
          ))}
        </div>

        <div className="mt-8 space-y-8">
          {letters.map((l) => (
            <section key={l} id={`letter-${l}`}>
              <h2 className="mb-2 text-xl font-bold text-brand-navy">{l}</h2>
              <dl className="space-y-3">
                {groups[l].map((t) => (
                  <div key={t.term} className="rounded-lg border bg-white p-4">
                    <dt className="font-semibold">{t.term}</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {t.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
