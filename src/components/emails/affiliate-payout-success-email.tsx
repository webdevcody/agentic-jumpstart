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
} from "@react-email/components";
import { EmailHeader } from "./email-header";
import { EmailFooter } from "./email-footer";

interface AffiliatePayoutSuccessEmailProps {
  affiliateName: string;
  payoutAmount: string;
  payoutDate: string;
  stripeTransferId: string;
}

export function AffiliatePayoutSuccessEmail({
  affiliateName,
  payoutAmount,
  payoutDate,
  stripeTransferId,
}: AffiliatePayoutSuccessEmailProps) {
  const previewText = `Your affiliate payout of ${payoutAmount} has been sent!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />

          {/* Main Content */}
          <Section style={contentSection}>
            {/* Success Badge */}
            <div style={badgeContainer}>
              <span style={badge}>PAYOUT SENT</span>
            </div>

            <Heading as="h1" style={heading}>
              Great news, {affiliateName}!
            </Heading>

            <Text style={description}>
              Your affiliate payout has been processed and sent to your
              connected Stripe account.
            </Text>

            <Hr style={hr} />

            {/* Payout Details */}
            <Section style={detailsSection}>
              <div style={detailRow}>
                <Text style={detailLabel}>Amount</Text>
                <Text style={detailValue}>{payoutAmount}</Text>
              </div>
              <div style={detailRow}>
                <Text style={detailLabel}>Date</Text>
                <Text style={detailValue}>{payoutDate}</Text>
              </div>
              <div style={detailRow}>
                <Text style={detailLabel}>Transfer ID</Text>
                <Text style={detailValueSmall}>{stripeTransferId}</Text>
              </div>
            </Section>

            <Hr style={hr} />

            <Text style={infoText}>
              The funds should appear in your Stripe balance shortly. Depending
              on your Stripe payout schedule, it may take a few business days
              for the funds to reach your bank account.
            </Text>

            <Text style={thankYouText}>
              Thank you for being a valued affiliate partner!
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

const hr = {
  borderColor: "#e1e8ed",
  margin: "24px 0",
};

const detailsSection = {
  padding: "16px 0",
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const detailLabel = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const detailValue = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
};

const detailValueSmall = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#374151",
  margin: "0",
  fontFamily: "monospace",
};

const infoText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "0 0 16px 0",
};

const thankYouText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#10b981",
  textAlign: "center" as const,
  fontWeight: "600",
  margin: "0",
};
