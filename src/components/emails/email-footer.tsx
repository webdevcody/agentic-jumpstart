import { Section, Text, Link, Hr } from "@react-email/components";
import { env } from "~/utils/env";
import { COMPANY_ADDRESS } from "~/config";

interface EmailFooterProps {
  unsubscribeUrl?: string;
  footerMessage?: string;
}

export function EmailFooter({
  unsubscribeUrl,
  footerMessage = "You're receiving this email because you signed up for updates from Agentic Jumpstart.",
}: EmailFooterProps) {
  return (
    <>
      <Hr style={hr} />
      <Section style={footer}>
        <Text style={footerText}>{footerMessage}</Text>

        <Text style={footerText}>
          <Link href={`${env.HOST_NAME}/settings`} style={link}>
            Manage your notification preferences
          </Link>
          {unsubscribeUrl && (
            <>
              {" · "}
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
              </Link>
            </>
          )}
        </Text>

        <Text style={footerText}>
          <Link href={`${env.HOST_NAME}`} style={link}>
            Agentic Jumpstart
          </Link>{" "}
          - Learn to build fast using LLMs tooling
        </Text>

        <Text style={footerText}>{COMPANY_ADDRESS.NAME}</Text>
        <Text style={footerText}>{COMPANY_ADDRESS.LINE1}</Text>
        <Text style={footerText}>
          {COMPANY_ADDRESS.CITY} {COMPANY_ADDRESS.STATE}, {COMPANY_ADDRESS.ZIP}
        </Text>
      </Section>
    </>
  );
}

const hr = {
  borderColor: "#e1e8ed",
  margin: "20px 0",
};

const footer = {
  paddingTop: "16px",
};

const footerText = {
  fontSize: "14px",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "8px 0",
};

const link = {
  color: "#3b82f6",
  textDecoration: "none",
};

const unsubscribeLink = {
  color: "#6b7280",
  textDecoration: "underline",
};
