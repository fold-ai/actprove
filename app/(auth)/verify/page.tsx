import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  return (
    <div className="space-y-4 text-center">
      <MailCheck className="mx-auto h-12 w-12 text-brand-green" />
      <h1 className="text-2xl font-bold">Verify your email</h1>
      <p className="text-muted-foreground">
        We&apos;ve sent a confirmation link to your inbox. Once verified,
        you&apos;ll be guided through a quick onboarding.
      </p>
      <Button asChild variant="outline">
        <Link href="/login">Back to login</Link>
      </Button>
    </div>
  );
}
