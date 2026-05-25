import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components";

interface DigestProps {
  orgName: string;
  healthScore: number;
  updates: { title: string; summary: string }[];
  topActions: string[];
  appUrl: string;
}

export default function MonthlyDigest({
  orgName = "Your company",
  healthScore = 0,
  updates = [],
  topActions = [],
  appUrl = "https://actprove.com",
}: DigestProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#F8F9FA", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <Heading style={{ color: "#1B4F72" }}>ActProve monthly digest</Heading>
          <Text>Hi {orgName}, here is your EU AI Act compliance summary.</Text>

          <Section
            style={{ background: "#fff", borderRadius: 8, padding: 16, margin: "16px 0" }}
          >
            <Text style={{ fontSize: 14, color: "#555", margin: 0 }}>
              Compliance health
            </Text>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#1D8348", margin: 0 }}>
              {healthScore}%
            </Text>
          </Section>

          <Heading as="h2" style={{ fontSize: 16, color: "#1B4F72" }}>
            This month&apos;s key updates
          </Heading>
          {updates.map((u, i) => (
            <Section key={i} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: "bold", margin: 0 }}>{u.title}</Text>
              <Text style={{ color: "#555", margin: 0 }}>{u.summary}</Text>
            </Section>
          ))}

          <Heading as="h2" style={{ fontSize: 16, color: "#1B4F72" }}>
            Top actions to improve compliance
          </Heading>
          {topActions.map((a, i) => (
            <Text key={i} style={{ margin: "2px 0" }}>
              • {a}
            </Text>
          ))}

          <Hr />
          <Button
            href={`${appUrl}/dashboard/register`}
            style={{
              background: "#1B4F72",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            Review your register
          </Button>
          <Text style={{ color: "#999", fontSize: 12, marginTop: 24 }}>
            ActProve · actprove.com · This is not legal advice.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
