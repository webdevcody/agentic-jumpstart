import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Preview,
  Heading,
  Button,
  Hr,
} from "@react-email/components";
import { EmailHeader } from "./email-header";
import { EmailFooter } from "./email-footer";
import { env } from "~/utils/env";

interface SegmentInfo {
  title: string;
  description: string;
  url: string;
  isPremium: boolean;
}

interface MultiSegmentNotificationEmailProps {
  segments: SegmentInfo[];
  unsubscribeUrl?: string;
  notificationType?: "new" | "updated";
}

export function MultiSegmentNotificationEmail({
  segments,
  unsubscribeUrl,
  notificationType = "new",
}: MultiSegmentNotificationEmailProps) {
  const badgeText =
    notificationType === "new" ? "NEW VIDEOS" : "UPDATED VIDEOS";
  const badgeColor = notificationType === "new" ? "#10b981" : "#3b82f6";

  const headingText =
    segments.length === 1
      ? `A ${notificationType === "new" ? "New" : "n Updated"} Lesson Is Available!`
      : `${segments.length} ${notificationType === "new" ? "New" : "Updated"} Lessons Are Available!`;

  const previewText =
    segments.length === 1
      ? `${notificationType === "new" ? "New video" : "Video updated"}: ${segments[0].title}`
      : `${segments.length} ${notificationType === "new" ? "new videos" : "updated videos"} available: ${segments.map((s) => s.title).join(", ")}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />

          {/* Main Content */}
          <Section style={contentSection}>
            {/* Badge */}
            <div style={badgeContainer}>
              <span style={{ ...badge, backgroundColor: badgeColor }}>
                {badgeText}
              </span>
            </div>

            <Heading as="h1" style={heading}>
              {headingText}
            </Heading>

            <Text style={introText}>
              {notificationType === "new"
                ? "We've added new content to help you on your learning journey. Check out what's new:"
                : "We've updated some of our content with improvements and new information:"}
            </Text>

            {/* Segment Cards */}
            {segments.map((segment, index) => (
              <div key={index}>
                <Section style={segmentCard}>
                  <div style={segmentHeader}>
                    <Text style={segmentTitle}>{segment.title}</Text>
                    {segment.isPremium && (
                      <span style={premiumBadge}>PREMIUM</span>
                    )}
                  </div>
                  {segment.description && (
                    <Text style={segmentDescription}>{segment.description}</Text>
                  )}
                  <Button href={segment.url} style={watchButton}>
                    Watch Now
                  </Button>
                </Section>
                {index < segments.length - 1 && <Hr style={divider} />}
              </div>
            ))}

            {/* Main CTA */}
            <Section style={ctaSection}>
              <Button href={`${env.HOST_NAME}/learn`} style={mainButton}>
                View All Lessons
              </Button>
            </Section>

            <Text style={ctaText}>
              Continue your learning journey and stay ahead with the latest
              content.
            </Text>
          </Section>

          <EmailFooter
            unsubscribeUrl={unsubscribeUrl}
            footerMessage="You're receiving this email because you signed up for course updates from Agentic Jumpstart."
          />
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "580px",
  maxWidth: "100%",
};

const contentSection = {
  padding: "32px 24px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e1e8ed",
  marginBottom: "16px",
};

const badgeContainer = {
  textAlign: "center" as const,
  marginBottom: "20px",
};

const badge = {
  display: "inline-block",
  backgroundColor: "#10b981",
  color: "#ffffff",
  padding: "6px 12px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  textTransform: "uppercase" as const,
};

const heading = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#1a1a1a",
  marginBottom: "16px",
  lineHeight: "1.3",
  textAlign: "center" as const,
  margin: "0 0 16px 0",
};

const introText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const segmentCard = {
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  marginBottom: "8px",
};

const segmentHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const segmentTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
  lineHeight: "1.4",
};

const premiumBadge = {
  display: "inline-block",
  backgroundColor: "#f59e0b",
  color: "#ffffff",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  marginLeft: "8px",
};

const segmentDescription = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#6b7280",
  margin: "0 0 12px 0",
};

const watchButton = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: "10px 20px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "16px 0",
};

const ctaSection = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "16px",
};

const mainButton = {
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  padding: "14px 28px",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  textAlign: "center" as const,
};

const ctaText = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "0",
};
