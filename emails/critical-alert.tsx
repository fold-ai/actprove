import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Text,
} from "@react-email/components";

interface CriticalAlertProps {
  title: string;
  summary: string;
  actions: string[];
  affectedSystems: string[];
  appUrl: string;
}

export default function CriticalAlert({
  title = "Critical EU AI Act update",
  summary = "",
  actions = [],
  affectedSystems = [],
  appUrl = "https://actprove.com",
}: CriticalAlertProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#F8F9FA", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <Section
            style={{ background: "#C0392B", borderRadius: 8, padding: 16 }}
          >
            <Text style={{ color: "#fff", margin: 0, fontWeight: "bold" }}>
              ⚠️ Critical EU AI Act Update — Action Required
            </Text>
          </Section>
          <Heading style={{ color: "#1B4F72" }}>{title}</Heading>
          <Text style={{ color: "#333" }}>{summary}</Text>

          {affectedSystems.length > 0 && (
            <Text style={{ color: "#555" }}>
              Affected systems: {affectedSystems.join(", ")}
            </Text>
          )}

          <Heading as="h2" style={{ fontSize: 16, color: "#1B4F72" }}>
            What to do
          </Heading>
          {actions.map((a, i) => (
            <Text key={i} style={{ margin: "2px 0" }}>
              • {a}
            </Text>
          ))}

          <Button
            href={`${appUrl}/dashboard/regulations`}
            style={{
              background: "#C0392B",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 6,
              textDecoration: "none",
              marginTop: 16,
              display: "inline-block",
            }}
          >
            Review impacted systems
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
