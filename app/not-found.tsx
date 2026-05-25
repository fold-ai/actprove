import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <Logo />
      <h1 className="text-5xl font-bold text-brand-navy">404</h1>
      <p className="text-muted-foreground">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
