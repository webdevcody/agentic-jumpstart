import { Segment } from "~/db/schema";
import { getAllVideoNotificationRecipients } from "~/data-access/users";
import {
  sendBulkEmails,
  renderVideoNotificationEmail,
} from "~/utils/email";
import { createUnsubscribeToken } from "~/data-access/unsubscribe-tokens";
import { env } from "~/utils/env";

export type VideoNotificationType = "new" | "updated";

/**
 * Sends email notifications to all subscribers about a segment
 * Includes: premium users, free users, and newsletter subscribers who opted in to course updates
 * @param segment The segment to notify about
 * @param notificationType Whether this is a "new" or "updated" segment
 */
export async function sendSegmentNotificationUseCase(
  segment: Segment,
  notificationType: VideoNotificationType = "new"
): Promise<{ sent: number; failed: number }> {
  // Get all recipients (premium, free, and newsletter subscribers)
  const allRecipients = await getAllVideoNotificationRecipients();

  if (allRecipients.length === 0) {
    console.log("[Video Notification] No recipients to notify");
    return { sent: 0, failed: 0 };
  }

  // Create video URL and description
  const videoUrl = `${env.HOST_NAME}/learn/${segment.slug}`;
  const videoDescription = segment.content
    ? segment.content.substring(0, 200) + "..."
    : notificationType === "new"
      ? "Check out this new video in the course and continue your learning journey!"
      : "This video has been updated with new content. Check it out!";

  // Determine subject line based on notification type
  const subjectPrefix = notificationType === "new" ? "New Video" : "Updated Video";

  // Prepare all emails with personalized content
  const emails = await Promise.all(
    allRecipients.map(async (recipient) => {
      // Generate unsubscribe token for all recipients (both users and newsletter-only)
      const unsubscribeToken = await createUnsubscribeToken(
        recipient.email,
        recipient.id ?? undefined
      );
      const unsubscribeUrl = `${env.HOST_NAME}/unsubscribe?token=${unsubscribeToken}`;

      // Render email HTML
      const html = await renderVideoNotificationEmail({
        videoTitle: segment.title,
        videoDescription,
        videoUrl,
        unsubscribeUrl,
        notificationType,
      });

      return {
        to: recipient.email,
        subject: `${subjectPrefix}: ${segment.title}`,
        html,
      };
    })
  );

  // Send all emails using the bulk email utility
  return sendBulkEmails(emails, {
    batchSize: 5,
    logPrefix: "Video Notification",
  });
}

/**
 * Sends email notifications to all subscribers about a new segment
 * @deprecated Use sendSegmentNotificationUseCase with notificationType="new" instead
 */
export async function sendNewSegmentNotificationUseCase(
  segment: Segment
): Promise<{ sent: number; failed: number }> {
  return sendSegmentNotificationUseCase(segment, "new");
}
