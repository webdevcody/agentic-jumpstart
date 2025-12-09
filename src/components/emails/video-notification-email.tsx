import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Preview,
  Img,
  Heading,
  Button,
} from "@react-email/components";
import { EmailHeader } from "./email-header";
import { EmailFooter } from "./email-footer";

interface VideoNotificationEmailProps {
  videoTitle: string;
  videoDescription?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  unsubscribeUrl?: string;
  notificationType?: "new" | "updated";
}

export function VideoNotificationEmail({
  videoTitle,
  videoDescription,
  videoUrl,
  thumbnailUrl,
  unsubscribeUrl,
  notificationType = "new",
}: VideoNotificationEmailProps) {
  const badgeText = notificationType === "new" ? "NEW VIDEO" : "UPDATED";
  const badgeColor = notificationType === "new" ? "#10b981" : "#3b82f6";
  const previewText =
    notificationType === "new"
      ? `New video available: ${videoTitle}`
      : `Video updated: ${videoTitle}`;

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
              {videoTitle}
            </Heading>

            {videoDescription && (
              <Text style={description}>{videoDescription}</Text>
            )}

            {/* Thumbnail if available */}
            {thumbnailUrl && (
              <div style={thumbnailContainer}>
                <Img
                  src={thumbnailUrl}
                  width="100%"
                  alt={videoTitle}
                  style={thumbnail}
                />
              </div>
            )}

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button href={videoUrl} style={button}>
                Watch Now
              </Button>
            </Section>

            <Text style={ctaText}>
              Click the button above to start watching this new video and
              continue your learning journey.
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

const description = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const thumbnailContainer = {
  marginBottom: "24px",
  borderRadius: "8px",
  overflow: "hidden",
};

const thumbnail = {
  width: "100%",
  height: "auto",
  display: "block",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "16px",
};

const button = {
  backgroundColor: "#3b82f6",
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

const benefitsSection = {
  padding: "20px 24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e1e8ed",
  marginBottom: "24px",
};

const benefitsHeading = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  marginBottom: "8px",
  margin: "0 0 8px 0",
};

const benefitsText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0",
};
