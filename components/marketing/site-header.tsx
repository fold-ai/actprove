import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          <Link href="/eu-ai-act" className="hover:text-foreground">
            EU AI Act Guide
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/eu-ai-act/checklist" className="hover:text-foreground">
            Free Checklist
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Start free trial</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            EU AI Act compliance operations for SMBs.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            ["Pricing", "/pricing"],
            ["Sign up", "/signup"],
            ["Log in", "/login"],
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            ["EU AI Act Guide", "/eu-ai-act"],
            ["Free Tools", "/tools"],
            ["Glossary", "/eu-ai-act/glossary"],
            ["By Country", "/eu-ai-act/germany"],
            ["Developer API", "/developers"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["About", "/about"],
            ["Blog", "/blog"],
            ["Changelog", "/changelog"],
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
            ["Security", "/security"],
          ]}
        />
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ActProve · actprove.com · Not legal advice.
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
