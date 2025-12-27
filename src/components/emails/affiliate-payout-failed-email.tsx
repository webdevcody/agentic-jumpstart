import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Preview,
  Heading,
  Hr,
  Button,
} from "@react-email/components";
import { EmailHeader } from "./email-header";
import { EmailFooter } from "./email-footer";
import { env } from "~/utils/env";

interface AffiliatePayoutFailedEmailProps {
  affiliateName: string;
  errorMessage: string;
  failureDate: string;
}

export function AffiliatePayoutFailedEmail({
  affiliateName,
  errorMessage,
  failureDate,
}: AffiliatePayoutFailedEmailProps) {
  const previewText = `Action required: Your affiliate payout could not be processed`;
  const affiliateDashboardUrl = `${env.HOST_NAME}/affiliates`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />

          {/* Main Content */}
          <Section style={contentSection}>
            {/* Error Badge */}
            <div style={badgeContainer}>
              <span style={badge}>ACTION REQUIRED</span>
            </div>

            <Heading as="h1" style={heading}>
              Payout Issue, {affiliateName}
            </Heading>

            <Text style={description}>
              We attempted to send your affiliate payout, but encountered an
              issue. Please review your Stripe account settings.
            </Text>

            <Hr style={hr} />

            {/* Error Details */}
            <Section style={errorSection}>
              <Text style={errorLabel}>Error Details</Text>
              <Text style={errorMessageStyle}>{errorMessage}</Text>
              <Text style={errorDate}>Occurred on: {failureDate}</Text>
            </Section>

            <Hr style={hr} />

            {/* Action Steps */}
            <Section style={stepsSection}>
              <Text style={stepsHeading}>What to do next:</Text>
              <Text style={stepItem}>
                1. Log into your Stripe account and verify your account details
              </Text>
              <Text style={stepItem}>
                2. Ensure your bank account information is correct and verified
              </Text>
              <Text style={stepItem}>
                3. Check if there are any pending verification requirements
              </Text>
              <Text style={stepItem}>
                4. Visit your affiliate dashboard to check your account status
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button href={affiliateDashboardUrl} style={button}>
                Go to Affiliate Dashboard
              </Button>
            </Section>

            <Text style={supportText}>
              If you continue to experience issues, please contact our support
              team for assistance.
            </Text>
          </Section>

          <EmailFooter footerMessage="You're receiving this email because you are an affiliate partner with Agentic Jumpstart." />
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
  backgroundColor: "#ef4444",
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

const hr = {
  borderColor: "#e1e8ed",
  margin: "24px 0",
};

const errorSection = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "16px",
  border: "1px solid #fecaca",
};

const errorLabel = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#991b1b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px 0",
};

const errorMessageStyle = {
  fontSize: "14px",
  color: "#b91c1c",
  margin: "0 0 8px 0",
  fontFamily: "monospace",
  wordBreak: "break-word" as const,
};

const errorDate = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "0",
};

const stepsSection = {
  padding: "0",
};

const stepsHeading = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 12px 0",
};

const stepItem = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0 0 8px 0",
  paddingLeft: "8px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0 16px 0",
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

const supportText = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "0",
};
