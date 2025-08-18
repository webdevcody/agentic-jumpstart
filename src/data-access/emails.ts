import { database } from "~/db";
import { emailBatches, users, userEmailPreferences } from "~/db/schema";
import { EmailBatchCreate, EmailBatch } from "~/db/schema";
import { eq, desc, and } from "drizzle-orm";

// Create a new email batch
export async function createEmailBatch(emailBatch: EmailBatchCreate): Promise<EmailBatch> {
  const [batch] = await database.insert(emailBatches).values(emailBatch).returning();
  return batch;
}

// Get all email batches, ordered by creation date
export async function getEmailBatches(): Promise<EmailBatch[]> {
  return await database
    .select()
    .from(emailBatches)
    .orderBy(desc(emailBatches.createdAt))
    .limit(10); // Only return the 10 most recent batches
}

// Get email batch by ID
export async function getEmailBatchById(id: number): Promise<EmailBatch | null> {
  const [batch] = await database
    .select()
    .from(emailBatches)
    .where(eq(emailBatches.id, id));
  
  return batch || null;
}

// Update email batch progress
export async function updateEmailBatchProgress(
  id: number, 
  updates: Partial<{
    sentCount: number;
    failedCount: number;
    status: string;
  }>
): Promise<void> {
  await database
    .update(emailBatches)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(emailBatches.id, id));
}

// Create or update user email preferences
export async function createOrUpdateEmailPreferences(
  userId: number,
  preferences: {
    allowCourseUpdates: boolean;
    allowPromotional: boolean;
  }
): Promise<void> {
  const existingPrefs = await database
    .select()
    .from(userEmailPreferences)
    .where(eq(userEmailPreferences.userId, userId))
    .limit(1);

  if (existingPrefs.length > 0) {
    // Update existing preferences
    await database
      .update(userEmailPreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(userEmailPreferences.userId, userId));
  } else {
    // Create new preferences
    await database
      .insert(userEmailPreferences)
      .values({
        userId,
        ...preferences,
      });
  }
}

// Get user email preferences
export async function getUserEmailPreferences(userId: number) {
  const [preferences] = await database
    .select()
    .from(userEmailPreferences)
    .where(eq(userEmailPreferences.userId, userId))
    .limit(1);

  // Return default preferences if none exist
  return preferences || {
    allowCourseUpdates: true,
    allowPromotional: true,
  };
}