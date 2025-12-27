import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { render } from "@react-email/render";
import { marked } from "marked";
import { env } from "~/utils/env";
import { createSignedUnsubscribeToken } from "~/utils/crypto";
import { CourseUpdateEmail } from "~/components/emails/course-update-email";
import { VideoNotificationEmail } from "~/components/emails/video-notification-email";
import { MultiSegmentNotificationEmail } from "~/components/emails/multi-segment-notification-email";
import { AffiliatePayoutSuccessEmail } from "~/components/emails/affiliate-payout-success-email";
import { AffiliatePayoutFailedEmail } from "~/components/emails/affiliate-payout-failed-email";

// Initialize SES client
const sesClient = new SESClient({
  region: env.AWS_SES_REGION,
  credentials: {
    accessKeyId: env.AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SES_SECRET_ACCESS_KEY,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: number; // Optional: if provided, adds List-Unsubscribe header
}

export interface EmailTemplate {
  subject: string;
  content: string;
  isMarketingEmail?: boolean; // Keep for backwards compatibility but always treated as true
}

/**
 * Builds a raw MIME email message with proper headers including List-Unsubscribe.
 */
function buildRawEmail(options: EmailOptions): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  // Build headers
  const headers: string[] = [
    `From: ${env.FROM_EMAIL_ADDRESS}`,
    `To: ${options.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString("base64")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  // Add List-Unsubscribe header if userId is provided (improves deliverability)
  if (options.userId) {
    const unsubscribeUrl = createUnsubscribeLink(options.userId);
    headers.push(`List-Unsubscribe: <${unsubscribeUrl}>`);
    headers.push(`List-Unsubscribe-Post: List-Unsubscribe=One-Click`);
  }

  // Build body parts
  const textPart = options.text || "Please view this email in an HTML-compatible email client.";
  const parts: string[] = [
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(textPart).toString("base64"),
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(options.html).toString("base64"),
    `--${boundary}--`,
  ];

  return headers.join("\r\n") + "\r\n\r\n" + parts.join("\r\n");
}

// Send email using AWS SES with List-Unsubscribe header support
export async function sendEmail(options: EmailOptions): Promise<void> {
  const rawMessage = buildRawEmail(options);

  const command = new SendRawEmailCommand({
    RawMessage: {
      Data: Buffer.from(rawMessage),
    },
  });

  try {
    await sesClient.send(command);
    // Don't log email addresses for security/privacy
    console.log(`[Email Sent] Subject: ${options.subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error}`);
  }
}

// Configure marked for email-safe HTML
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
});

// Render email template to HTML
export async function renderEmailTemplate(
  template: EmailTemplate
): Promise<string> {
  try {
    // Convert markdown content to HTML
    const htmlContent = await marked.parse(template.content);

    // Use react-email to render the email template
    const html = await render(
      CourseUpdateEmail({
        subject: template.subject,
        content: template.content,
        htmlContent: htmlContent,
        // Always include unsubscribe URL placeholder
        unsubscribeUrl: "{{unsubscribeUrl}}",
      })
    );
    return html;
  } catch (error) {
    console.error("Failed to render email template:", error);
    throw new Error(`Failed to render email template: ${error}`);
  }
}

// Send bulk emails with rate limiting
export async function sendBulkEmails(
  emails: Array<{ to: string; subject: string; html: string }>,
  options?: {
    batchSize?: number;
    logPrefix?: string;
    onProgress?: (sent: number, total: number) => void;
  }
): Promise<{ sent: number; failed: number }> {
  const { batchSize = 5, logPrefix = "Bulk Email", onProgress } = options || {};

  let sent = 0;
  let failed = 0;

  console.log(`[${logPrefix}] Starting to send ${emails.length} emails`);

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(emails.length / batchSize);

    console.log(
      `[${logPrefix}] Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`
    );

    // Send emails in parallel for this batch
    const promises = batch.map(async (email) => {
      try {
        await sendEmail(email);
        // Don't log email addresses for security/privacy
        console.log(`[${logPrefix}] Successfully sent email`);
        return { success: true };
      } catch (error) {
        // Don't log email addresses for security/privacy
        console.error(`[${logPrefix}] Failed to send email:`, error);
        return { success: false };
      }
    });

    const results = await Promise.all(promises);

    // Count successes and failures
    results.forEach((result) => {
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    });

    // Report progress
    if (onProgress) {
      onProgress(sent, emails.length);
    }

    // Rate limiting: wait 1 second between batches
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `[${logPrefix}] Completed: ${sent} sent, ${failed} failed out of ${emails.length} total`
  );
  return { sent, failed };
}

// Verify email delivery (check bounce/complaint rates)
export async function checkEmailDeliveryHealth(): Promise<{
  bounceRate: number;
  complaintRate: number;
  isHealthy: boolean;
}> {
  // In production, this should fetch real SES statistics
  // TODO: Implement real SES stats fetching using GetSendStatisticsCommand
  if (env.NODE_ENV === "production") {
    throw new Error(
      "checkEmailDeliveryHealth() is not implemented for production. " +
        "Please implement real SES statistics fetching using GetSendStatisticsCommand."
    );
  }

  // Development/test mock data
  return {
    bounceRate: 0.01, // 1%
    complaintRate: 0.001, // 0.1%
    isHealthy: true,
  };
}

// Create unsubscribe link with cryptographically signed token
export function createUnsubscribeLink(userId: number): string {
  const token = createSignedUnsubscribeToken(userId);
  return `${env.HOST_NAME}/unsubscribe?token=${encodeURIComponent(token)}`;
}

// Validate email template before sending
export function validateEmailTemplate(template: EmailTemplate): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!template.subject || template.subject.trim().length === 0) {
    errors.push("Subject is required");
  }

  if (template.subject && template.subject.length > 200) {
    errors.push("Subject is too long (max 200 characters)");
  }

  if (!template.content || template.content.trim().length === 0) {
    errors.push("Content is required");
  }

  if (template.content && template.content.length > 100000) {
    errors.push("Content is too long (max 100,000 characters)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Render video notification email template
export interface VideoNotificationTemplateProps {
  videoTitle: string;
  videoDescription?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  unsubscribeUrl?: string;
  notificationType?: "new" | "updated";
}

export async function renderVideoNotificationEmail(
  props: VideoNotificationTemplateProps
): Promise<string> {
  try {
    const html = await render(VideoNotificationEmail(props));
    return html;
  } catch (error) {
    console.error("Failed to render video notification email:", error);
    throw new Error(`Failed to render video notification email: ${error}`);
  }
}

// Render multi-segment notification email template
export interface MultiSegmentNotificationTemplateProps {
  segments: Array<{
    title: string;
    description: string;
    url: string;
    isPremium: boolean;
  }>;
  unsubscribeUrl?: string;
  notificationType?: "new" | "updated";
}

export async function renderMultiSegmentNotificationEmail(
  props: MultiSegmentNotificationTemplateProps
): Promise<string> {
  try {
    const html = await render(MultiSegmentNotificationEmail(props));
    return html;
  } catch (error) {
    console.error("Failed to render multi-segment notification email:", error);
    throw new Error(`Failed to render multi-segment notification email: ${error}`);
  }
}

// Render and send affiliate payout success email
export interface AffiliatePayoutSuccessEmailProps {
  affiliateName: string;
  payoutAmount: string;
  payoutDate: string;
  stripeTransferId: string;
}

export async function sendAffiliatePayoutSuccessEmail(
  to: string,
  props: AffiliatePayoutSuccessEmailProps
): Promise<void> {
  try {
    const html = await render(AffiliatePayoutSuccessEmail(props));
    const text = await render(AffiliatePayoutSuccessEmail(props), {
      plainText: true,
    });
    await sendEmail({
      to,
      subject: `Your affiliate payout of ${props.payoutAmount} has been sent!`,
      html,
      text,
    });
    console.log(
      `[Affiliate Email] Sent payout success notification for ${props.stripeTransferId}`
    );
  } catch (error) {
    console.error("Failed to send affiliate payout success email:", error);
    // Don't throw - email failures shouldn't break the payout flow
  }
}

// Render and send affiliate payout failed email
export interface AffiliatePayoutFailedEmailProps {
  affiliateName: string;
  errorMessage: string;
  failureDate: string;
}

export async function sendAffiliatePayoutFailedEmail(
  to: string,
  props: AffiliatePayoutFailedEmailProps
): Promise<void> {
  try {
    const html = await render(AffiliatePayoutFailedEmail(props));
    const text = await render(AffiliatePayoutFailedEmail(props), {
      plainText: true,
    });
    await sendEmail({
      to,
      subject: "Action required: Your affiliate payout could not be processed",
      html,
      text,
    });
    console.log(`[Affiliate Email] Sent payout failure notification`);
  } catch (error) {
    console.error("Failed to send affiliate payout failed email:", error);
    // Don't throw - email failures shouldn't break the webhook flow
  }
}
