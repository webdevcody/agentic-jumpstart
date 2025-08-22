import { database } from "~/db";
import {
  User,
  users,
  userEmailPreferences,
  newsletterSignups,
} from "~/db/schema";
import { eq, and, isNull, or, isNotNull } from "drizzle-orm";
import { UserId } from "~/use-cases/types";

export async function deleteUser(userId: UserId) {
  await database.delete(users).where(eq(users.id, userId));
}

export async function getUser(userId: UserId) {
  const user = await database.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user;
}

export async function createUser(email: string) {
  const [user] = await database.insert(users).values({ email }).returning();
  return user;
}

export async function getUserByEmail(email: string) {
  const user = await database.query.users.findFirst({
    where: eq(users.email, email),
  });

  return user;
}

export async function setEmailVerified(userId: UserId) {
  await database
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, userId));
}

export async function updateUser(userId: UserId, updatedUser: Partial<User>) {
  await database.update(users).set(updatedUser).where(eq(users.id, userId));
}

export async function updateUserToPremium(userId: UserId) {
  await database
    .update(users)
    .set({ isPremium: true })
    .where(eq(users.id, userId));
}

// Get newsletter subscribers for emailing
export async function getNewsletterSubscribersForEmailing(
  subscriptionType: "newsletter" | "waitlist" | "both"
): Promise<Array<{ email: string }>> {
  let whereConditions: any[] = [];

  if (subscriptionType === "newsletter") {
    whereConditions.push(eq(newsletterSignups.subscriptionType, "newsletter"));
  } else if (subscriptionType === "waitlist") {
    whereConditions.push(eq(newsletterSignups.subscriptionType, "waitlist"));
  }
  // For "both", we don't add any filter

  const result = await database
    .select({
      email: newsletterSignups.email,
    })
    .from(newsletterSignups)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  return result;
}

// Get users for emailing based on criteria
// Note: All emails now include unsubscribe links, but we still respect user preferences
export async function getUsersForEmailing(
  recipientType: "all" | "premium" | "free" | "newsletter" | "waitlist",
  isMarketingEmail: boolean = true // Default to true since all emails now have unsubscribe
): Promise<Array<{ id?: number; email: string }>> {
  // Handle newsletter/waitlist recipients separately
  if (recipientType === "newsletter" || recipientType === "waitlist") {
    const newsletterSubs =
      await getNewsletterSubscribersForEmailing(recipientType);
    return newsletterSubs.map((sub) => ({ email: sub.email }));
  }

  // Base query with email preferences join
  let baseQuery = database
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .leftJoin(userEmailPreferences, eq(users.id, userEmailPreferences.userId));

  // Filter by user type
  let whereConditions: any[] = [];

  switch (recipientType) {
    case "premium":
      whereConditions.push(eq(users.isPremium, true));
      break;
    case "free":
      whereConditions.push(eq(users.isPremium, false));
      break;
    // "all" doesn't add any filter
  }

  // Email notification preferences filter based on email type
  // Note: All emails now include unsubscribe links for compliance
  if (isMarketingEmail) {
    // For promotional/marketing emails, include users with no preferences (defaults to true) OR those who allow promotional emails
    whereConditions.push(
      or(
        isNull(userEmailPreferences.userId),
        eq(userEmailPreferences.allowPromotional, true)
      )
    );
  } else {
    // For course update emails, include users with no preferences (defaults to true) OR those who allow course updates
    whereConditions.push(
      or(
        isNull(userEmailPreferences.userId),
        eq(userEmailPreferences.allowCourseUpdates, true)
      )
    );
  }

  // Ensure we have a valid email address
  whereConditions.push(isNotNull(users.email));

  // Apply all conditions
  if (whereConditions.length > 0) {
    baseQuery = baseQuery.where(and(...whereConditions));
  }

  const result = await baseQuery;

  // Filter out null emails just in case
  return result.filter(
    (user): user is { id: number; email: string } =>
      user.email !== null && user.email !== undefined
  );
}

// Create default email preferences for all users who don't have them
export async function createMissingEmailPreferences(): Promise<number> {
  // Get all users who don't have email preferences
  const usersWithoutPrefs = await database
    .select({
      id: users.id,
    })
    .from(users)
    .leftJoin(userEmailPreferences, eq(users.id, userEmailPreferences.userId))
    .where(isNull(userEmailPreferences.userId));

  if (usersWithoutPrefs.length === 0) {
    return 0;
  }

  // Create default preferences for all users without them
  const defaultPreferences = usersWithoutPrefs.map((user) => ({
    userId: user.id,
    allowCourseUpdates: true,
    allowPromotional: true,
  }));

  await database.insert(userEmailPreferences).values(defaultPreferences);

  return usersWithoutPrefs.length;
}

// Get all users with their profile information for admin
export async function getAllUsersWithProfiles() {
  const usersWithProfiles = await database.query.users.findMany({
    with: {
      profile: true,
    },
    orderBy: (users, { desc }) => [desc(users.id)],
  });

  return usersWithProfiles;
}
