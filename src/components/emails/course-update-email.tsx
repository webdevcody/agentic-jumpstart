import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Preview,
  Img,
} from "@react-email/components";
import { env } from "~/utils/env";

interface CourseUpdateEmailProps {
  subject: string;
  content: string;
  htmlContent?: string;
  unsubscribeUrl?: string;
}

export function CourseUpdateEmail({
  subject,
  content,
  htmlContent,
  unsubscribeUrl,
}: CourseUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={`${env.HOST_NAME}/logo.png`}
              width="48"
              height="48"
              alt="Agentic Jumpstart"
              style={logo}
            />
            <Text style={brandName}>Agentic Jumpstart</Text>
          </Section>

          {/* Main Content */}
          <Section style={content_section}>
            <Text style={heading}>{subject}</Text>
            {htmlContent ? (
              <div
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={markdownContent}
              />
            ) : (
              <Text style={paragraph}>{content}</Text>
            )}
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this email because you're enrolled in our course.
            </Text>

            <Text style={footerText}>
              <Link href={`${env.HOST_NAME}/settings`} style={link}>
                Manage your notification settings
              </Link>
            </Text>

            <Text style={footerText}>
              Don't want to receive these emails?{" "}
              <Link href={unsubscribeUrl || "#"} style={unsubscribeLink}>
                Unsubscribe here
              </Link>
            </Text>

            <Text style={footerText}>
              <Link href={`${env.HOST_NAME}`} style={link}>
                Agentic Jumpstart
              </Link>{" "}
              - Learn to build AI agents that work
            </Text>
          </Section>
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

const header = {
  display: "flex" as const,
  alignItems: "center" as const,
  marginBottom: "32px",
  padding: "20px 24px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e1e8ed",
  justifyContent: "center" as const,
};

const logo = {
  borderRadius: "8px",
  marginRight: "12px",
};

const brandName = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
};

const content_section = {
  padding: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e1e8ed",
  marginBottom: "24px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1a1a1a",
  marginBottom: "16px",
  lineHeight: "1.3",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  whiteSpace: "pre-wrap" as const,
  margin: "0",
};

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

const markdownContent = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0",
  "& h1": {
    fontSize: "24px",
    fontWeight: "600",
    marginTop: "24px",
    marginBottom: "16px",
  },
  "& h2": {
    fontSize: "20px",
    fontWeight: "600",
    marginTop: "20px",
    marginBottom: "12px",
  },
  "& h3": {
    fontSize: "18px",
    fontWeight: "600",
    marginTop: "16px",
    marginBottom: "8px",
  },
  "& p": {
    marginBottom: "16px",
  },
  "& ul, & ol": {
    marginBottom: "16px",
    paddingLeft: "24px",
  },
  "& li": {
    marginBottom: "4px",
  },
  "& code": {
    backgroundColor: "#f3f4f6",
    padding: "2px 4px",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "monospace",
  },
  "& pre": {
    backgroundColor: "#f3f4f6",
    padding: "12px",
    borderRadius: "6px",
    overflow: "auto",
    marginBottom: "16px",
  },
  "& blockquote": {
    borderLeft: "4px solid #e5e7eb",
    paddingLeft: "16px",
    marginBottom: "16px",
    fontStyle: "italic",
    color: "#6b7280",
  },
  "& a": {
    color: "#3b82f6",
    textDecoration: "underline",
  },
  "& strong": {
    fontWeight: "600",
  },
  "& em": {
    fontStyle: "italic",
  },
  "& hr": {
    borderTop: "1px solid #e5e7eb",
    marginTop: "24px",
    marginBottom: "24px",
  },
};
