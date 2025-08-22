import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "~/lib/auth";
import {
  createEmailBatch,
  getEmailBatches,
  getEmailBatchById,
  updateEmailBatchProgress,
} from "~/data-access/emails";
import {
  getUsersForEmailing,
  createMissingEmailPreferences,
  getUserByEmail,
  getNewsletterSubscribersForEmailing,
} from "~/data-access/users";
import { getNewsletterSignupsCount, getEmailSignupAnalytics } from "~/data-access/newsletter";
import { sendEmail, renderEmailTemplate } from "~/utils/email";
import { EmailBatchCreate } from "~/db/schema";
import { createUnsubscribeToken } from "~/data-access/unsubscribe-tokens";

// Email form validation schema
const emailFormSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  content: z.string().min(1, "Content is required"),
  recipientType: z.enum(["all", "premium", "free", "newsletter", "waitlist"]),
});

const testEmailSchema = z.object({
  email: z.email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
});

// Create email batch and start sending
export const createEmailBatchFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator(emailFormSchema)
  .handler(async ({ data, context }) => {
    try {
      // Ensure all users have email preferences set
      await createMissingEmailPreferences();

      // Get users for emailing based on criteria (always include marketing email users since all emails now have unsubscribe)
      const users = await getUsersForEmailing(
        data.recipientType,
        true // Always treat as marketing email
      );

      // Render email content to HTML (always include unsubscribe link)
      const htmlContent = await renderEmailTemplate({
        subject: data.subject,
        content: data.content,
        isMarketingEmail: true,
      });

      // Create email batch record
      const emailBatch: EmailBatchCreate = {
        subject: data.subject,
        htmlContent,
        recipientCount: users.length,
        adminId: context.userId!,
        status: "pending",
      };

      const batch = await createEmailBatch(emailBatch);

      // Start background email sending process (don't await)
      processBulkEmails(
        batch.id,
        users,
        data.subject,
        htmlContent,
        true // Always include unsubscribe link
      );

      return { success: true, batchId: batch.id };
    } catch (error) {
      console.error("Failed to create email batch:", error);
      throw new Error("Failed to create email batch");
    }
  });

// Send test email
export const sendTestEmailFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .validator(testEmailSchema)
  .handler(async ({ data }) => {
    try {
      // Lookup the user by email in the database
      const user = await getUserByEmail(data.email);

      if (!user) {
        throw new Error(
          "Cannot send test emails to users who are not in our system"
        );
      }

      // Render email content to HTML (always include unsubscribe link)
      let htmlContent = await renderEmailTemplate({
        subject: data.subject,
        content: data.content,
        isMarketingEmail: true, // Always include unsubscribe link
      });

      // Always generate unsubscribe token since all emails now include unsubscribe
      const unsubscribeToken = await createUnsubscribeToken(
        user.id,
        data.email
      );
      const unsubscribeUrl = `${process.env.BASE_URL}/unsubscribe?token=${unsubscribeToken}`;

      // Replace the unsubscribe placeholder with the actual URL
      htmlContent = htmlContent.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

      await sendEmail({
        to: data.email,
        subject: data.subject,
        html: htmlContent,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send test email:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to send test email"
      );
    }
  });

// Get email batches for admin
export const getEmailBatchesFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      return await getEmailBatches();
    } catch (error) {
      console.error("Failed to get email batches:", error);
      throw new Error("Failed to get email batches");
    }
  });

// Get email batch status
export const getEmailBatchStatusFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .validator(z.object({ batchId: z.number() }))
  .handler(async ({ data }) => {
    try {
      return await getEmailBatchById(data.batchId);
    } catch (error) {
      console.error("Failed to get email batch status:", error);
      throw new Error("Failed to get email batch status");
    }
  });

// Get users for emailing statistics
export const getUsersForEmailingFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      // Ensure all users have email preferences set
      await createMissingEmailPreferences();

      const allUsers = await getUsersForEmailing("all", false);
      const premiumUsers = await getUsersForEmailing("premium", false);
      const freeUsers = await getUsersForEmailing("free", false);
      const newsletterUsers = await getUsersForEmailing("newsletter", true);
      const waitlistUsers = await getUsersForEmailing("waitlist", true);

      return {
        totalUsers: allUsers.length,
        premiumUsers: premiumUsers.length,
        freeUsers: freeUsers.length,
        newsletterUsers: newsletterUsers.length,
        waitlistUsers: waitlistUsers.length,
      };
    } catch (error) {
      console.error("Failed to get users for emailing:", error);
      throw new Error("Failed to get users for emailing");
    }
  });

// Background email processing with rate limiting
async function processBulkEmails(
  batchId: number,
  users: Array<{ id?: number; email: string }>,
  subject: string,
  htmlContent: string,
  isMarketingEmail: boolean = true // Keep parameter for backwards compatibility but always true
) {
  try {
    // Update batch status to processing
    await updateEmailBatchProgress(batchId, { status: "processing" });

    let sentCount = 0;
    let failedCount = 0;
    const BATCH_SIZE = 5; // 5 emails per second rate limit

    // Process emails in batches with rate limiting
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      // Send emails in parallel for this batch
      const promises = batch.map(async (user) => {
        try {
          let finalHtmlContent = htmlContent;
          
          // Generate unsubscribe token if user has an ID (registered user)
          if (user.id) {
            const unsubscribeToken = await createUnsubscribeToken(
              user.id,
              user.email
            );
            const unsubscribeUrl = `${process.env.BASE_URL}/unsubscribe?token=${unsubscribeToken}`;
            
            // Replace the unsubscribeUrl placeholder in the template
            finalHtmlContent = htmlContent.replace(
              /{{unsubscribeUrl}}/g,
              unsubscribeUrl
            );
          } else {
            // For newsletter subscribers without user accounts, provide a generic unsubscribe
            const unsubscribeUrl = `${process.env.BASE_URL}/unsubscribe?email=${encodeURIComponent(user.email)}`;
            finalHtmlContent = htmlContent.replace(
              /{{unsubscribeUrl}}/g,
              unsubscribeUrl
            );
          }

          await sendEmail({
            to: user.email,
            subject,
            html: finalHtmlContent,
          });
          return { success: true };
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
          return { success: false };
        }
      });

      const results = await Promise.all(promises);

      // Count successes and failures
      results.forEach((result) => {
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      });

      // Update progress
      await updateEmailBatchProgress(batchId, {
        sentCount,
        failedCount,
      });

      // Rate limiting: wait 1 second between batches to maintain 5 emails/second
      if (i + BATCH_SIZE < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Mark batch as completed
    await updateEmailBatchProgress(batchId, {
      status: "completed",
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("Failed to process bulk emails:", error);

    // Mark batch as failed
    await updateEmailBatchProgress(batchId, {
      status: "failed",
    });
  }
}

// Get email signup analytics
export const getEmailAnalyticsFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .validator(z.object({ 
    year: z.number(),
    month: z.number(),
    type: z.enum(["waitlist", "newsletter"]).default("waitlist")
  }))
  .handler(async ({ data }) => {
    try {
      return await getEmailSignupAnalytics(data.year, data.month, data.type);
    } catch (error) {
      console.error("Failed to get email analytics:", error);
      throw new Error("Failed to get email analytics");
    }
  });
