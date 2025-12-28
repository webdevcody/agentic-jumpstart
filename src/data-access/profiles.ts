import { database } from "~/db";
import {
  Profile,
  profiles,
  projects,
  Project,
  ProjectCreate,
  users,
} from "~/db/schema";
import { UserId } from "~/use-cases/types";
import { eq, desc, and, count, ilike } from "drizzle-orm";
import { getPublicName, toPublicProfile } from "~/utils/name-helpers";
import { getStorage } from "~/utils/storage";

// Generate fresh presigned URL from imageId, fallback to stored image URL
async function generateImageUrl(
  imageId: string | null,
  fallbackImage: string | null
): Promise<string | null> {
  if (!imageId) return fallbackImage; // Fallback for old records without imageId
  try {
    const { storage } = getStorage();
    return await storage.getPresignedUrl(imageId);
  } catch (error) {
    console.error(`Failed to generate presigned URL for ${imageId}:`, error);
    return fallbackImage;
  }
}

export async function createProfile(
  userId: UserId,
  displayName: string,
  image?: string,
  realName?: string
) {
  const [profile] = await database
    .insert(profiles)
    .values({
      userId,
      image,
      displayName,
      realName,
    })
    .onConflictDoNothing()
    .returning();
  return profile;
}

export async function updateProfile(
  userId: UserId,
  updateProfile: Partial<Profile>
) {
  await database
    .update(profiles)
    .set(updateProfile)
    .where(eq(profiles.userId, userId));
}

export async function getProfile(userId: UserId) {
  const profile = await database.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  if (!profile) return null;

  // Generate fresh presigned URL from imageId
  const image = await generateImageUrl(profile.imageId, profile.image);
  return { ...profile, image };
}

export async function getProfileWithProjects(userId: UserId) {
  const profile = await database.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
    with: {
      projects: {
        where: eq(projects.isVisible, true),
        orderBy: [desc(projects.order), desc(projects.createdAt)],
      },
    },
  });

  if (!profile) return null;

  // Generate fresh presigned URL from imageId
  const image = await generateImageUrl(profile.imageId, profile.image);
  return { ...profile, image };
}

export async function getPublicProfile(userId: UserId) {
  const profile = await database.query.profiles.findFirst({
    where: and(eq(profiles.userId, userId), eq(profiles.isPublicProfile, true)),
    with: {
      projects: {
        where: eq(projects.isVisible, true),
        orderBy: [desc(projects.order), desc(projects.createdAt)],
      },
    },
  });

  if (profile) {
    // Strip PII (realName, useDisplayName) and add computed publicName
    const safeProfile = toPublicProfile(profile);
    // Generate fresh presigned URL from imageId
    const image = await generateImageUrl(profile.imageId, profile.image);
    return {
      ...safeProfile,
      image,
      projects: profile.projects || [],
    };
  }

  return null;
}

// Project management functions
export async function createProject(
  userId: UserId,
  projectData: Omit<ProjectCreate, "userId">
) {
  const [project] = await database
    .insert(projects)
    .values({
      ...projectData,
      userId,
    })
    .returning();
  return project;
}

export async function updateProject(
  projectId: number,
  userId: UserId,
  projectData: Partial<Project>
) {
  const [updatedProject] = await database
    .update(projects)
    .set({
      ...projectData,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning();
  return updatedProject;
}

export async function deleteProject(projectId: number, userId: UserId) {
  await database
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

export async function getUserProjects(userId: UserId) {
  return await database.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: [desc(projects.order), desc(projects.createdAt)],
  });
}

export async function getPublicMembers() {
  const members = await database
    .select({
      id: users.id,
      displayName: profiles.displayName,
      realName: profiles.realName,
      useDisplayName: profiles.useDisplayName,
      imageId: profiles.imageId,
      image: profiles.image,
      bio: profiles.bio,
      flair: profiles.flair,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.isPublicProfile, true))
    .orderBy(desc(profiles.updatedAt));

  // Strip PII (realName, useDisplayName), add publicName, generate fresh image URLs
  return Promise.all(
    members.map(async (member) => {
      const { realName, useDisplayName, imageId, image: storedImage, ...safeMember } = member;
      const image = await generateImageUrl(imageId, storedImage);
      return {
        ...safeMember,
        image,
        publicName: getPublicName(member),
      };
    })
  );
}

export async function getCommunityStats() {
  const [totalUsersResult] = await database
    .select({ count: count() })
    .from(users);

  const [publicProfilesResult] = await database
    .select({ count: count() })
    .from(profiles)
    .where(eq(profiles.isPublicProfile, true));

  return {
    totalUsers: totalUsersResult.count,
    publicProfiles: publicProfilesResult.count,
  };
}

export async function displayNameExists(displayName: string): Promise<boolean> {
  const existing = await database.query.profiles.findFirst({
    where: ilike(profiles.displayName, displayName),
  });
  return existing !== undefined;
}
