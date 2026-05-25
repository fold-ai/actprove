export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  /** Simple HTML body. */
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "eu-ai-act-deadline-what-smbs-must-do",
    title: "The August 2026 EU AI Act deadline: what SMBs must do now",
    date: "2026-05-20",
    category: "Education",
    excerpt:
      "High-risk obligations and Article 50 transparency become enforceable on 2 August 2026. Here's a practical, prioritized plan for small teams.",
    body: `<p>The EU AI Act's main enforcement date is 2 August 2026. If your company provides or deploys AI in the EU — including third-party tools like ChatGPT, CRM AI or chatbots — it applies to you.</p>
<h2>Five steps before the deadline</h2>
<ol><li>Inventory every AI tool in use.</li><li>Classify each system by risk tier.</li><li>Publish transparency notices for customer-facing AI (Article 50).</li><li>Document an AI usage policy and staff AI literacy (Article 4).</li><li>Keep a living register your national authority can review.</li></ol>
<p>Most SMBs using standard SaaS tools fall under minimal or limited risk — the work is documentation, not engineering.</p>`,
  },
  {
    slug: "how-to-write-a-transparency-notice",
    title: "How to write an EU AI Act transparency notice",
    date: "2026-05-15",
    category: "How-to",
    excerpt:
      "Article 50 requires you to tell users when they interact with AI. Here's what a compliant notice contains.",
    body: `<p>Article 50 of the EU AI Act requires that people are informed when they interact with an AI system, and that AI-generated content is labelled.</p>
<h2>What to include</h2>
<ul><li>A clear statement that the user is interacting with AI.</li><li>What the system does and its limits.</li><li>How to reach a human.</li><li>A contact point (e.g. your DPO).</li></ul>
<p>ActProve generates a tailored transparency notice for each public-facing system in seconds.</p>`,
  },
  {
    slug: "provider-vs-deployer",
    title: "EU AI Act: are you a provider or a deployer?",
    date: "2026-05-08",
    category: "Education",
    excerpt:
      "Your obligations depend on your role. Most SMBs are deployers — with much lighter requirements.",
    body: `<p>A <strong>provider</strong> develops an AI system and places it on the market. A <strong>deployer</strong> uses one under its authority. ~85% of SMBs are deployers.</p>
<p>Deployers must use high-risk AI per instructions, ensure human oversight, keep logs, and verify their provider's compliance (Article 26). Providers carry the heavier burden of risk management, technical documentation and conformity assessment.</p>`,
  },
];

export function getPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
