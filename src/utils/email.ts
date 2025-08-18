import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { render } from "@react-email/render";
import { marked } from "marked";
import { env } from "~/utils/env";
import { CourseUpdateEmail } from "~/components/emails/course-update-email";

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
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error}`);
  }
}

// Configure marked for email-safe HTML
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
  sanitize: false, // We'll handle sanitization separately if needed
  smartLists: true,
  smartypants: true,
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
  onProgress?: (sent: number, total: number) => void
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  const BATCH_SIZE = 5; // 5 emails per second rate limit

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);

    // Send emails in parallel for this batch
    const promises = batch.map(async (email) => {
      try {
        await sendEmail(email);
        return { success: true };
      } catch (error) {
        console.error(`Failed to send email to ${email.to}:`, error);
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
    if (i + BATCH_SIZE < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

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
