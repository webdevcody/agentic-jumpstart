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
import { eq, desc, and, count } from "drizzle-orm";

export async function createProfile(
  userId: UserId,
  displayName: string,
  image?: string
) {
  const [profile] = await database
    .insert(profiles)
    .values({
      userId,
      image,
      displayName,
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

  return profile;
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

  return profile;
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
    // Return profile without sensitive information
    return {
      ...profile,
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
      image: profiles.image,
      bio: profiles.bio,
      flair: profiles.flair,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.isPublicProfile, true))
    .orderBy(desc(profiles.updatedAt));

  return members;
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
