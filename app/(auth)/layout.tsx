import Link from "next/link";
import { Logo } from "@/components/logo";
import { PRIMARY_DEADLINE, daysUntil } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const days = daysUntil(PRIMARY_DEADLINE);
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
      <div className="hidden flex-col justify-between bg-brand-navy p-12 text-white lg:flex">
        <Logo showText className="[&_*]:!text-white" />
        <div className="space-y-6">
          <p className="text-3xl font-bold leading-snug">
            From AI inventory to audit-ready compliance — in under 2 hours.
          </p>
          <p className="text-white/70">
            ActProve helps EU SMBs achieve, document, and maintain EU AI Act
            compliance without hiring lawyers or enterprise GRC consultants.
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm">
            <span className="font-semibold text-brand-green-light">
              {days} days
            </span>
            <span className="text-white/70">
              until the August 2, 2026 enforcement deadline
            </span>
          </div>
        </div>
        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} ActProve · actprove.com
        </p>
      </div>
    </div>
  );
}
