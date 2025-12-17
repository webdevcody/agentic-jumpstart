import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { render } from "@react-email/render";
import { marked } from "marked";
import { env } from "~/utils/env";
import { CourseUpdateEmail } from "~/components/emails/course-update-email";
import { VideoNotificationEmail } from "~/components/emails/video-notification-email";
import { MultiSegmentNotificationEmail } from "~/components/emails/multi-segment-notification-email";

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
}

export interface EmailTemplate {
  subject: string;
  content: string;
  isMarketingEmail?: boolean; // Keep for backwards compatibility but always treated as true
}

// Send email using AWS SES
export async function sendEmail(options: EmailOptions): Promise<void> {
  const command = new SendEmailCommand({
    Source: env.FROM_EMAIL_ADDRESS,
    Destination: {
      ToAddresses: [options.to],
    },
    Message: {
      Subject: {
        Data: options.subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: options.html,
          Charset: "UTF-8",
        },
        ...(options.text && {
          Text: {
            Data: options.text,
            Charset: "UTF-8",
          },
        }),
      },
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
  // In a real implementation, you would fetch SES statistics
  // For now, return mock data
  return {
    bounceRate: 0.01, // 1%
    complaintRate: 0.001, // 0.1%
    isHealthy: true,
  };
}

// Create unsubscribe link
export function createUnsubscribeLink(userId: number): string {
  // In a real implementation, you would create a signed URL or token
  return `${env.HOST_NAME}/unsubscribe?user=${userId}`;
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
