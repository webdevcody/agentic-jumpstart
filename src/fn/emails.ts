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
} from "~/data-access/users";
import { getEmailSignupAnalytics } from "~/data-access/newsletter";
import { sendEmail, renderEmailTemplate, sendBulkEmails } from "~/utils/email";
import { EmailBatchCreate } from "~/db/schema";
import { createUnsubscribeToken } from "~/data-access/unsubscribe-tokens";
import { env } from "~/utils/env";

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

      // Check if there are users to email
      if (users.length === 0) {
        console.warn(
          `[Email Batch ${batch.id}] No users found for recipient type: ${data.recipientType}`
        );
        await updateEmailBatchProgress(batch.id, {
          status: "completed",
          sentCount: 0,
          failedCount: 0,
        });
        return {
          success: true,
          batchId: batch.id,
          warning: "No recipients found",
        };
      }

      // Start background email sending process (don't await)
      // Wrap in catch to handle any errors and prevent unhandled promise rejections
      processBulkEmails(
        batch.id,
        users,
        data.subject,
        htmlContent,
        true // Always include unsubscribe link
      ).catch((error) => {
        console.error(
          `[Email Batch ${batch.id}] Background processing failed:`,
          error
        );
        // Update batch status to failed if the error occurs before processing starts
        updateEmailBatchProgress(batch.id, {
          status: "failed",
        }).catch((updateError) => {
          console.error(
            `[Email Batch ${batch.id}] Failed to update status after error:`,
            updateError
          );
        });
      });

      console.log(
        `[Email Batch ${batch.id}] Started processing ${users.length} emails`
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
        data.email,
        user.id
      );
      const unsubscribeUrl = `${env.HOST_NAME}/unsubscribe?token=${unsubscribeToken}`;

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
  _isMarketingEmail: boolean = true // Keep parameter for backwards compatibility but always true
) {
  try {
    // Update batch status to processing
    await updateEmailBatchProgress(batchId, { status: "processing" });

    // Prepare all emails with personalized unsubscribe URLs
    const emails = await Promise.all(
      users.map(async (user) => {
        let finalHtmlContent = htmlContent;

        // Generate unsubscribe token for all recipients (both users and newsletter-only)
        const unsubscribeToken = await createUnsubscribeToken(
          user.email,
          user.id ?? undefined
        );
        const unsubscribeUrl = `${env.HOST_NAME}/unsubscribe?token=${unsubscribeToken}`;
        finalHtmlContent = htmlContent.replace(
          /{{unsubscribeUrl}}/g,
          unsubscribeUrl
        );

        return {
          to: user.email,
          subject,
          html: finalHtmlContent,
        };
      })
    );

    // Send emails using the bulk email utility with progress tracking
    const { sent, failed } = await sendBulkEmails(emails, {
      batchSize: 5,
      logPrefix: `Email Batch ${batchId}`,
      onProgress: async (sentCount, total) => {
        // Update progress in database
        await updateEmailBatchProgress(batchId, {
          sentCount,
          failedCount: total - sentCount,
        });
      },
    });

    // Mark batch as completed
    await updateEmailBatchProgress(batchId, {
      status: "completed",
      sentCount: sent,
      failedCount: failed,
    });
  } catch (error) {
    console.error(`[Email Batch ${batchId}] Failed to process:`, error);

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
  .validator(
    z.object({
      year: z.number(),
      month: z.number(),
      type: z.enum(["waitlist", "newsletter"]).default("waitlist"),
    })
  )
  .handler(async ({ data }) => {
    try {
      return await getEmailSignupAnalytics(data.year, data.month, data.type);
    } catch (error) {
      console.error("Failed to get email analytics:", error);
      throw new Error("Failed to get email analytics");
    }
  });
