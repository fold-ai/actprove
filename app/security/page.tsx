import { LegalPage } from "@/app/(legal)/legal-page";

export const metadata = { title: "Security & Privacy" };

export default function Security() {
  return (
    <LegalPage title="Security & Privacy">
      <p>
        Trust is core to a compliance product. Here&apos;s how ActProve protects
        your data.
      </p>
      <h2>Data isolation</h2>
      <p>
        Every tenant&apos;s data is isolated using PostgreSQL row-level security.
        Server-side authorization is enforced in every API call.
      </p>
      <h2>Authentication</h2>
      <p>
        Authentication is handled by Supabase Auth with email/password, magic
        links, and Google OAuth. Sessions are managed via secure cookies.
      </p>
      <h2>Payments</h2>
      <p>
        We never store credit card data. All billing is processed by Stripe.
      </p>
      <h2>Encryption</h2>
      <p>
        Data is encrypted in transit (HTTPS) and at rest in the database and
        storage layer.
      </p>
    </LegalPage>
  );
}
