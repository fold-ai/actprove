import { EU_EEA_COUNTRIES } from "@/lib/constants";
import { slugify } from "@/lib/slug";

export interface CountryFaq {
  q: string;
  a: string;
}

export interface CountryPage {
  slug: string;
  code: string;
  name: string;
  language: string;
  authority: string;
  strategy: string;
  smbStat: string;
  nuance: string;
  cta: string; // localized CTA
  faqs: CountryFaq[];
}

/** Rich, localized detail for priority markets (spec §6.4.2). */
const DETAILS: Record<
  string,
  Partial<Omit<CountryPage, "slug" | "code" | "name">>
> = {
  DE: {
    language: "German",
    authority: "Bundesnetzagentur (with the Bundesdatenschutzbehörde / BfDI)",
    strategy: "National AI Strategy (KI-Strategie der Bundesregierung)",
    smbStat: "Germany has ~3.5M SMBs; AI adoption in the Mittelstand is rising fast.",
    nuance:
      "German companies operate in a strong privacy culture with high documentation expectations. Map your EU AI Act obligations alongside the BDSG (Bundesdatenschutzgesetz) and expect thorough record-keeping during any Bundesnetzagentur review.",
    cta: "Kostenlos starten — 14 Tage kostenlos testen",
    faqs: [
      { q: "Wer setzt den EU AI Act in Deutschland durch?", a: "Die Bundesnetzagentur ist die zentrale Marktüberwachungsbehörde; bei datenschutzrelevanten KI-Systemen ist auch die BfDI beteiligt." },
      { q: "Gilt der EU AI Act für mein KMU?", a: "Ja, wenn Sie KI-Systeme im EU-Markt anbieten oder einsetzen — auch Standard-Tools wie ChatGPT oder CRM-KI fallen darunter." },
    ],
  },
  FR: {
    language: "French",
    authority: "CNIL and the Autorité de régulation de la communication audiovisuelle et numérique (Arcom)",
    strategy: "Stratégie nationale pour l'intelligence artificielle",
    smbStat: "France counts ~3.9M SMBs; the CNIL has been notably active on AI investigations.",
    nuance:
      "French companies expect French-language official guidance. The CNIL's prior AI enforcement means documentation of lawful basis and transparency is scrutinised closely.",
    cta: "Commencez gratuitement — essai gratuit de 14 jours",
    faqs: [
      { q: "Qui applique le règlement IA en France ?", a: "La CNIL et l'Arcom sont les autorités compétentes pour la surveillance du marché et la protection des droits." },
      { q: "Le règlement IA s'applique-t-il à ma PME ?", a: "Oui, dès que vous fournissez ou déployez des systèmes d'IA sur le marché européen, y compris des outils tiers." },
    ],
  },
  NL: {
    language: "Dutch",
    authority: "Autoriteit Persoonsgegevens (AP)",
    strategy: "Nederlandse AI Coalitie (NL AIC)",
    smbStat: "The Netherlands has the highest AI adoption per capita in the EU — ~1.2M SMBs.",
    nuance:
      "With high AI adoption, Dutch SMBs often have more systems to inventory than peers. The AP coordinates supervision; the startup ecosystem (StartupDelta) is a strong distribution channel.",
    cta: "Begin gratis — 14 dagen gratis proberen",
    faqs: [
      { q: "Wie handhaaft de AI-verordening in Nederland?", a: "De Autoriteit Persoonsgegevens coördineert het toezicht op AI-systemen." },
      { q: "Geldt de AI-verordening voor mijn mkb?", a: "Ja, zodra u AI-systemen aanbiedt of gebruikt op de EU-markt." },
    ],
  },
  PL: {
    language: "Polish",
    authority: "Urząd Ochrony Danych Osobowych (UODO)",
    strategy: "Polityka Rozwoju Sztucznej Inteligencji w Polsce",
    smbStat: "Poland is a fast-growing tech hub with ~2.1M SMBs; English is common in tech but Polish is expected for legal docs.",
    nuance:
      "Polish SMBs increasingly serve EU enterprise clients who request compliance proof. Keep legal documentation in Polish even where day-to-day work happens in English.",
    cta: "Zacznij za darmo — 14 dni za darmo",
    faqs: [
      { q: "Kto egzekwuje akt o AI w Polsce?", a: "Nadzór koordynuje UODO we współpracy z organami sektorowymi." },
      { q: "Czy akt o AI dotyczy mojej firmy?", a: "Tak, jeśli dostarczasz lub używasz systemów AI na rynku UE — w tym narzędzi takich jak ChatGPT." },
    ],
  },
  ES: {
    language: "Spanish",
    authority: "Agencia Española de Supervisión de la Inteligencia Artificial (AESIA)",
    strategy: "Estrategia Nacional de Inteligencia Artificial (ENIA)",
    smbStat: "Spain has ~2.8M SMBs and was the first EU member state to set up a dedicated AI supervisory agency (AESIA).",
    nuance:
      "Spain's dedicated AI agency (AESIA, based in A Coruña) signals proactive enforcement. Spanish-language documentation and clear transparency notices are expected.",
    cta: "Empieza gratis — prueba gratuita de 14 días",
    faqs: [
      { q: "¿Quién aplica el Reglamento de IA en España?", a: "La AESIA es la agencia nacional de supervisión de la inteligencia artificial." },
      { q: "¿Se aplica el Reglamento de IA a mi pyme?", a: "Sí, si ofrece o utiliza sistemas de IA en el mercado de la UE." },
    ],
  },
  IT: {
    language: "Italian",
    authority: "Agenzia per l'Italia Digitale (AgID) and the Garante per la protezione dei dati personali",
    strategy: "Strategia Italiana per l'Intelligenza Artificiale",
    smbStat: "Italy has ~4.4M SMBs — one of the largest SMB populations in the EU.",
    nuance:
      "Italy's Garante has taken high-profile AI actions (including a temporary ChatGPT block in 2023). Transparency and lawful-basis documentation are scrutinised.",
    cta: "Inizia gratis — prova gratuita di 14 giorni",
    faqs: [
      { q: "Chi applica il regolamento sull'IA in Italia?", a: "AgID e il Garante per la protezione dei dati personali sono le autorità competenti." },
      { q: "Il regolamento sull'IA si applica alla mia PMI?", a: "Sì, se fornisci o utilizzi sistemi di IA nel mercato dell'UE." },
    ],
  },
  IE: {
    language: "English",
    authority: "Data Protection Commission (DPC)",
    strategy: "AI — Here for Good: National AI Strategy",
    smbStat: "Many US tech companies are EU-registered in Ireland and need IE-facing compliance.",
    nuance:
      "Ireland hosts the EU operations of many global tech firms. The DPC is a lead supervisory authority for GDPR for many of them, and AI Act obligations layer on top.",
    cta: "Start free — 14-day free trial",
    faqs: [
      { q: "Who enforces the EU AI Act in Ireland?", a: "Ireland is designating its market-surveillance authorities; the DPC leads on data-protection-related AI matters." },
    ],
  },
  SE: {
    language: "Swedish",
    authority: "IMY (Integritetsskyddsmyndigheten) and sector regulators",
    strategy: "Nationell inriktning för artificiell intelligens",
    smbStat: "Sweden has ~900K SMBs with very high digital literacy and AI readiness.",
    nuance:
      "Swedish organisations have well-established GDPR-compliant AI expectations. Documentation tends to be pragmatic but thorough.",
    cta: "Kom igång gratis — prova gratis i 14 dagar",
    faqs: [
      { q: "Vem upprätthåller AI-förordningen i Sverige?", a: "IMY och sektorsmyndigheter ansvarar för tillsynen." },
    ],
  },
  BE: {
    language: "Dutch/French",
    authority: "Autorité de protection des données / Gegevensbeschermingsautoriteit",
    strategy: "Belgian AI convergence plan",
    smbStat: "Belgium hosts the EU institutions — proximity to policymakers raises compliance awareness.",
    nuance:
      "Belgium is bilingual (Dutch/French); provide guidance in both where your audience is mixed. EU-institution proximity means high scrutiny.",
    cta: "Start gratis / Commencez gratuitement",
    faqs: [],
  },
  AT: {
    language: "German",
    authority: "Datenschutzbehörde (DSB)",
    strategy: "Artificial Intelligence Mission Austria 2030 (AIM AT 2030)",
    smbStat: "Austria's Mittelstand mirrors Germany's strong documentation culture.",
    nuance:
      "Austrian companies share the DACH region's high documentation expectations; German-language outputs are expected.",
    cta: "Kostenlos starten — 14 Tage testen",
    faqs: [],
  },
};

function build(code: string, name: string): CountryPage {
  const d = DETAILS[code] ?? {};
  return {
    slug: slugify(name),
    code,
    name,
    language: d.language ?? "English",
    authority:
      d.authority ?? "the national market-surveillance authority (being designated)",
    strategy: d.strategy ?? "a national AI strategy aligned with the EU approach",
    smbStat:
      d.smbStat ??
      `${name} businesses that provide or deploy AI in the EU market fall within scope of the EU AI Act.`,
    nuance:
      d.nuance ??
      `The EU AI Act applies uniformly across the EU, but enforcement is handled locally in ${name}. Keep your inventory, risk classifications and documentation audit-ready for the national authority.`,
    cta: d.cta ?? "Start free — 14-day free trial",
    faqs:
      d.faqs ?? [
        {
          q: `Does the EU AI Act apply to my business in ${name}?`,
          a: "Yes — any organisation that provides or deploys AI systems in the EU market is in scope, including users of third-party tools like ChatGPT, CRM AI or chatbots.",
        },
      ],
  };
}

export const COUNTRY_PAGES: CountryPage[] = EU_EEA_COUNTRIES.map((c) =>
  build(c.code, c.name),
);

export function getCountryPage(slug: string): CountryPage | undefined {
  return COUNTRY_PAGES.find((c) => c.slug === slug);
}
