import { LegalPage } from "@/app/(legal)/legal-page";

export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This is a placeholder privacy policy for ActProve. Before launch, have
        this reviewed by legal counsel.
      </p>
      <h2>What we collect</h2>
      <p>
        Account details (name, email, company), the AI system data you enter,
        and product usage analytics.
      </p>
      <h2>How data is stored</h2>
      <p>
        Data is stored in Supabase (PostgreSQL) with row-level security so each
        organisation&apos;s data is isolated. We never store payment card data —
        billing is handled by Stripe.
      </p>
      <h2>Your rights</h2>
      <p>
        You may access, export, or delete your data at any time by contacting
        support.
      </p>
    </LegalPage>
  );
}
