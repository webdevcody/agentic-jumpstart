import {
  createUser,
  deleteUser,
  getUserByEmail,
  updateUserToPremium,
} from "~/data-access/users";
import { PublicError } from "./errors";
import { GoogleUser, UserId, UserSession } from "./types";
import {
  createProfile,
  getProfile,
  displayNameExists,
} from "~/data-access/profiles";
import { createAccountViaGoogle } from "~/data-access/accounts";
import { createOrUpdateEmailPreferences } from "~/data-access/emails";
import { getCurrentUser } from "~/utils/session";
import { isAdmin } from "~/lib/auth";
import { generateUniqueAlias } from "~/utils/alias-generator";

export async function deleteUserUseCase(
  authenticatedUser: UserSession,
  userToDeleteId: UserId
): Promise<void> {
  if (authenticatedUser.id !== userToDeleteId) {
    throw new PublicError("You can only delete your own account");
  }

  await deleteUser(userToDeleteId);
}

export async function getUserProfileUseCase(userId: UserId) {
  const profile = await getProfile(userId);

  if (!profile) {
    throw new PublicError("User not found");
  }

  return profile;
}

export async function createGoogleUserUseCase(googleUser: GoogleUser) {
  let existingUser = await getUserByEmail(googleUser.email);

  if (!existingUser) {
    existingUser = await createUser(googleUser.email);

    // Create default email preferences for new users
    await createOrUpdateEmailPreferences(existingUser.id, {
      allowCourseUpdates: true,
      allowPromotional: true,
    });
  }

  await createAccountViaGoogle(existingUser.id, googleUser.sub);

  // Generate a unique alias instead of using real name for privacy
  const alias = await generateUniqueAlias(displayNameExists);
  // Store both alias (displayName) and original name (realName) separately
  await createProfile(existingUser.id, alias, googleUser.picture, googleUser.name);

  return existingUser.id;
}

export async function isAdminUseCase() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }
    return isAdmin(user);
  } catch (error) {
    console.error("Error checking if user is admin:", error);
    return false;
  }
}

export async function updateUserToPremiumUseCase(userId: UserId) {
  await updateUserToPremium(userId);
}
